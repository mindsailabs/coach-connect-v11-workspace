import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('=== Generate Session Analysis ===');
        
        const base44 = createClientFromRequest(req);
        const { session_id } = await req.json();

        if (!session_id) {
            return Response.json({ success: false, error: 'Missing session_id' }, { status: 400 });
        }

        const session = await base44.asServiceRole.entities.Session.get(session_id);
        if (!session) {
            return Response.json({ success: false, error: 'Session not found' }, { status: 404 });
        }

        console.log('Analyzing session:', session.title);

        const contact = session.contact_id ? await base44.asServiceRole.entities.Contact.get(session.contact_id) : null;
        const clientName = contact?.full_name || 'Client';
        const user = await base44.auth.me();

        // Get transcript
        const artifactsResponse = await base44.asServiceRole.functions.invoke('getSessionArtifactContent', { sessionId: session_id });
        const artifacts = artifactsResponse.data;
        
        if (!artifacts.transcript && !artifacts.notes) {
            return Response.json({ success: false, error: 'Session needs transcript for analysis' }, { status: 400 });
        }

        const transcript = artifacts.transcript || artifacts.notes;

        // Get KB articles
        const knowledgeBase = await base44.asServiceRole.entities.KnowledgeBase.filter({ is_active: true });
        console.log(`Found ${knowledgeBase.length} active KB articles`);

        // Clear previous unapplied references and actions
        const unappliedRefs = await base44.asServiceRole.entities.AppliedReference.filter({ session_id, isApplied: false });
        for (const ref of unappliedRefs) { await base44.asServiceRole.entities.AppliedReference.delete(ref.id); }

        const unappliedActions = await base44.asServiceRole.entities.Action.filter({ session_id, isApplied: false });
        for (const action of unappliedActions) { await base44.asServiceRole.entities.Action.delete(action.id); }

        // Analyze each KB article
        const relevantArticles = [];

        for (const kb of knowledgeBase) {
            console.log(`Analyzing: ${kb.title}`);
            
            const kbPrompt = `You are analyzing a coaching session transcript to find relevant knowledge base articles.\n\nTRANSCRIPT:\n${transcript}\n\nKNOWLEDGE BASE ARTICLE:\nTitle: ${kb.title}\nContent: ${kb.content}\n\nMATCH TYPES: topic_match, symptom_match, condition_match, behaviour_match, goal_match, values_match, intervention_match, system_match, emotion_match, belief_match, barrier_match, resource_match\n\nTASK:\n1. Score relevance 1-10\n2. If score >= 5, identify 2-5 specific matches with transcript excerpt, KB section, match type, and reason\n\nReturn JSON:\n{\n  "relevanceScore": number,\n  "matchReason": "explanation",\n  "matches": [{ "transcriptExcerpt": "", "kbSection": "", "matchType": "", "matchReason": "", "speaker": "coach or client" }]\n}`;

            const kbStartTime = Date.now();
            try {
                const kbResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${Deno.env.get('LLM_API_KEY')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: 'You are an expert health coach AI. Return valid JSON only.' },
                            { role: 'user', content: kbPrompt }
                        ],
                        max_tokens: 2000,
                        temperature: 0.3
                    })
                });

                const kbData = await kbResponse.json();
                
                if (kbData.usage) {
                    base44.asServiceRole.entities.APIUsageLog.create({
                        functionName: 'generateSessionAnalysis', objectType: 'session', objectId: session_id,
                        model: 'gpt-4o-mini', promptTokens: kbData.usage.prompt_tokens,
                        completionTokens: kbData.usage.completion_tokens,
                        totalTokens: kbData.usage.total_tokens,
                        estimatedCost: (kbData.usage.prompt_tokens * 0.00000015) + (kbData.usage.completion_tokens * 0.0000006),
                        requestedBy: user?.email || 'system', requestedAt: new Date().toISOString(),
                        responseTime: Date.now() - kbStartTime, success: true
                    }).catch(err => console.error('Log error:', err));
                }
                
                if (!kbData.choices?.[0]) continue;

                let responseText = kbData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                let analysis;
                try { analysis = JSON.parse(responseText); } catch (e) { continue; }
                
                if (analysis.relevanceScore >= 5) {
                    const matchTypeCounts = {};
                    (analysis.matches || []).forEach(m => { if (m.matchType) matchTypeCounts[m.matchType] = (matchTypeCounts[m.matchType] || 0) + 1; });
                    let primaryMatchType = 'topic_match';
                    let maxCount = 0;
                    for (const [type, count] of Object.entries(matchTypeCounts)) {
                        if (count > maxCount) { maxCount = count; primaryMatchType = type; }
                    }
                    
                    await base44.asServiceRole.entities.AppliedReference.create({
                        contact_id: session.contact_id, session_id, knowledge_base_id: kb.id,
                        match_type: "Topic Match", matchType: primaryMatchType,
                        match_reason: analysis.matchReason, relevanceScore: analysis.relevanceScore,
                        matchedSections: JSON.stringify(analysis.matches || []),
                        applied_at: new Date().toISOString(), applied_by: user?.email || 'system'
                    });
                    
                    relevantArticles.push({ kb_id: kb.id, kb_title: kb.title, relevanceScore: analysis.relevanceScore, matchType: primaryMatchType });
                }
            } catch (error) {
                console.error(`KB analysis error for ${kb.title}:`, error.message);
            }
        }

        console.log(`${relevantArticles.length} relevant articles found`);

        // Generate coach actions
        let actionsGenerated = 0;
        
        const actionsPrompt = `You are analyzing a coaching session to generate follow-up tasks.\n\nTRANSCRIPT:\n${transcript}\n\nACTION TYPES: follow_up, resource_sharing, scheduling, documentation, planning, research, coordination, review, intervention_setup, check_in\n\nPRACTITIONER APPROVAL: Set requiresApproval=true with requiredSpecialty for:\n- Diet/meal plans → Dietitian\n- Supplements → Nutritionist\n- Exercise for conditions → Physiotherapist\n- Mental health → Therapist\n- Medical symptoms → Doctor\n- Behavioral health → Counselor\n\nGenerate 3-8 action items with sourceContext (client quote that led to this).\n\nReturn JSON: { "actions": [{ "title": "", "description": "", "actionType": "", "priority": "High/Medium/Low", "sourceContext": "", "requiresApproval": boolean, "requiredSpecialty": "" }] }`;

        const actionsStartTime = Date.now();
        try {
            const actionsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('LLM_API_KEY')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a health coach AI. Return valid JSON only.' },
                        { role: 'user', content: actionsPrompt }
                    ],
                    max_tokens: 1500, temperature: 0.4
                })
            });

            const actionsData = await actionsResponse.json();
            
            if (actionsData.usage) {
                base44.asServiceRole.entities.APIUsageLog.create({
                    functionName: 'generateSessionAnalysis', objectType: 'session', objectId: session_id,
                    model: 'gpt-4o-mini', promptTokens: actionsData.usage.prompt_tokens,
                    completionTokens: actionsData.usage.completion_tokens,
                    totalTokens: actionsData.usage.total_tokens,
                    estimatedCost: (actionsData.usage.prompt_tokens * 0.00000015) + (actionsData.usage.completion_tokens * 0.0000006),
                    requestedBy: user?.email || 'system', requestedAt: new Date().toISOString(),
                    responseTime: Date.now() - actionsStartTime, success: true
                }).catch(err => console.error('Log error:', err));
            }
            
            if (actionsData.choices?.[0]) {
                let responseText = actionsData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const actionsAnalysis = JSON.parse(responseText);
                const now = new Date().toISOString();
                
                for (const action of actionsAnalysis.actions || []) {
                    const needsApproval = action.requiresApproval === true;
                    await base44.asServiceRole.entities.Action.create({
                        session_id, contact_id: session.contact_id,
                        title: action.title, description: action.description,
                        sourceContext: action.sourceContext || null,
                        actionType: action.actionType, priority: action.priority || null,
                        status: 'To Do', isApplied: false, createdAt: now,
                        requiresApproval: needsApproval,
                        requiredSpecialty: needsApproval ? action.requiredSpecialty : null,
                        approvalStatus: needsApproval ? 'Pending' : 'Not Required'
                    });
                    
                    await base44.asServiceRole.entities.Task.create({
                        session_id, contact_id: session.contact_id, taskContext: 'session',
                        title: action.title, description: action.description,
                        priority: action.priority?.toLowerCase() || 'medium',
                        status: 'open', created_at: now, updated_at: now
                    });
                    
                    actionsGenerated++;
                }
            }
        } catch (error) {
            console.error('Actions generation error:', error.message);
        }

        console.log(`Generated ${actionsGenerated} actions`);

        return Response.json({
            success: true, session_id, contact_id: session.contact_id,
            references: relevantArticles,
            summary: {
                total_kb_analyzed: knowledgeBase.length,
                relevant_references_saved: relevantArticles.length,
                actions_generated: actionsGenerated
            }
        });

    } catch (error) {
        console.error('=== Generate Session Analysis Error ===');
        console.error('Error:', error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});
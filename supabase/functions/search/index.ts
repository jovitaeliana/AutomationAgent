import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, serpApiKey, options } = await req.json()

    console.log('Search request received:', { query, hasApiKey: !!serpApiKey, options })

    if (!query || !serpApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: query or serpApiKey' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build SerpAPI request parameters
    const searchParams = new URLSearchParams({
      q: query,
      api_key: serpApiKey,
      engine: 'google',
      location: options?.location || 'Singapore',
      hl: options?.hl || 'en',
      gl: options?.gl || 'sg',
      num: (options?.num || 10).toString()
    })

    // Call SerpAPI
    const serpResponse = await fetch(`https://serpapi.com/search?${searchParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutomationAgent/1.0)'
      }
    })

    if (!serpResponse.ok) {
      const errorData = await serpResponse.text()
      console.error('SerpAPI error:', errorData)
      
      return new Response(
        JSON.stringify({ error: `SerpAPI request failed (${serpResponse.status}): ${errorData}` }),
        { 
          status: serpResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const serpData = await serpResponse.json()
    
    // Process and format the search results
    let formattedResults = ''
    
    if (serpData.organic_results && serpData.organic_results.length > 0) {
      formattedResults += 'Search Results:\n\n'
      
      serpData.organic_results.slice(0, options?.num || 10).forEach((result: any, index: number) => {
        formattedResults += `${index + 1}. ${result.title}\n`
        formattedResults += `   URL: ${result.link}\n`
        if (result.snippet) {
          formattedResults += `   Description: ${result.snippet}\n`
        }
        formattedResults += '\n'
      })
    }

    // Add answer box if available
    if (serpData.answer_box) {
      formattedResults = `Quick Answer: ${serpData.answer_box.answer || serpData.answer_box.snippet}\n\n` + formattedResults
    }

    // Add knowledge graph if available
    if (serpData.knowledge_graph) {
      const kg = serpData.knowledge_graph
      formattedResults = `Knowledge Graph: ${kg.title || ''}\n${kg.description || ''}\n\n` + formattedResults
    }

    // Add related questions if available
    if (serpData.related_questions && serpData.related_questions.length > 0) {
      formattedResults += '\nRelated Questions:\n'
      serpData.related_questions.slice(0, 3).forEach((q: any, index: number) => {
        formattedResults += `${index + 1}. ${q.question}\n`
      })
    }

    if (!formattedResults.trim()) {
      formattedResults = 'No search results found for the given query.'
    }

    return new Response(
      JSON.stringify({ 
        results: formattedResults,
        raw_data: serpData // Include raw data for debugging if needed
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

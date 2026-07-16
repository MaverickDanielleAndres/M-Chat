import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Webhook payload:', payload)

    // Only process UPDATE events on user_profiles
    if (payload.type === 'UPDATE' && payload.table === 'user_profiles') {
      const oldRecord = payload.old_record
      const newRecord = payload.record

      // Check if subscription_tier changed
      if (oldRecord.subscription_tier !== newRecord.subscription_tier) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Log an audit event
        await supabase.from('audit_events').insert({
          user_id: newRecord.id,
          action: 'subscription_upgrade',
          details: {
            old_tier: oldRecord.subscription_tier,
            new_tier: newRecord.subscription_tier,
            trigger: 'webhook'
          },
          ip_address: '127.0.0.1'
        })

        // 2. Grant a one-time 100 bonus credits for the upgrade
        if (newRecord.subscription_tier === 'pro' || newRecord.subscription_tier === 'premium') {
          // Get current wallet
          const { data: wallet } = await supabase
            .from('credit_wallets')
            .select('balance, lifetime_granted')
            .eq('user_id', newRecord.id)
            .single()

          if (wallet) {
            await supabase
              .from('credit_wallets')
              .update({
                balance: wallet.balance + 100,
                lifetime_granted: wallet.lifetime_granted + 100,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', newRecord.id)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Processed successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

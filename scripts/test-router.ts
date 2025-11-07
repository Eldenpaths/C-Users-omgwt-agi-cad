import { AGI_Router } from '../src/core/router/IntelligenceRouter'

(async () => {
  const result = await AGI_Router.routeTask({
    goal: 'Validate plasma lab stability check',
    context: 'scientific',
    d_var_threshold: 2.0,
    canon_constraints: ['IP.FS-QMIX.01'],
  })
  console.log(JSON.stringify(result, null, 2))
})().catch(e=>{ console.error(e); process.exit(1) })

const readline = require('readline')
const fs = require('fs')
const path = require('path')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const envPath = path.join(__dirname, '.env.local')

console.log('\n=== Reparar SERVICE ROLE KEY en .env.local ===\n')
console.log('Ve a: https://supabase.com/dashboard/project/faanavtlylmlwxzrtgao/settings/api')
console.log('Copia el "service_role" key (el de abajo, el secreto)')
console.log('')

rl.question('Pega el SERVICE ROLE KEY aqui y pulsa Enter:\n> ', (key) => {
  const trimmed = key.trim()

  const existing = fs.readFileSync(envPath, 'utf8')
  const lines = existing.split('\n').filter((l) => !l.startsWith('SUPABASE_SERVICE_ROLE_KEY=') && l !== '')
  lines.push('SUPABASE_SERVICE_ROLE_KEY=' + trimmed)
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8')

  console.log('\n✓ SERVICE_ROLE_KEY actualizado en .env.local')
  console.log('✓ Reinicia el servidor: para el npm run dev y vuelve a iniciarlo\n')
  rl.close()
})

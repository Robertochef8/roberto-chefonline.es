const readline = require('readline')
const fs = require('fs')
const path = require('path')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const URL = 'https://faanavtlylmlwxzrtgao.supabase.co'

console.log('\n=== Creador de .env.local para Chef Online ===\n')
console.log('URL ya configurada: ' + URL)
console.log('')

rl.question('Pega el ANON KEY y pulsa Enter:\n> ', (anon) => {
  rl.question('\nPega el SERVICE ROLE KEY y pulsa Enter:\n> ', (service) => {
    const content =
      'NEXT_PUBLIC_SUPABASE_URL=' + URL + '\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=' + anon.trim() + '\n' +
      'SUPABASE_SERVICE_ROLE_KEY=' + service.trim() + '\n'

    const envPath = path.join(__dirname, '.env.local')
    fs.writeFileSync(envPath, content, 'utf8')

    console.log('\n✓ Archivo .env.local creado en: ' + envPath)
    console.log('✓ Ahora reinicia el servidor con: npm run dev\n')
    rl.close()
  })
})

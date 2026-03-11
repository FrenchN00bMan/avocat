const bcrypt = require('bcrypt');

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node scripts/hash_password.js "mot-de-passe"');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

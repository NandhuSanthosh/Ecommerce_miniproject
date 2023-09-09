const bcrypt = require('bcrypt')
const hasPassword = 'Ruban@123';

async function has() {
    console.log(await bcrypt.hash(hasPassword, 10))
}

has();
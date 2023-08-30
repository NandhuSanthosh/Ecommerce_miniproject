const router = require('express').Router()

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};


router.use((req, res, next) => {
    setCorsHeaders(res);
    next();
});
router.options('/', (req, res)=>{
    res.send();
})

router.get('/', (req, res) => {
    res.send({string: "The fuck is wrong withou"});
});

module.exports = router;
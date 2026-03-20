const express = require("express");
const router = express.Router();
const { handleCassoWebhook } = require("../controllers/paymentWebhookController");

router.get("/casso", (req, res) => {
    res.json({
        success: true,
        message: "Casso webhook endpoint is ready",
        method: "POST",
    });
});

router.post("/casso", handleCassoWebhook);

module.exports = router;

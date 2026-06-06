const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const evaluateLevel = async (req, res) => {
    const { answers } = req.body

    try {
        const prompt = `Είσαι ειδικός εκπαιδευτής σκι και snowboard. Με βάση τις παρακάτω απαντήσεις ενός μαθητή, αξιολόγησε το επίπεδό του.

Απαντήσεις:
- Έχει ξανακάνει σκι/snowboard: ${answers.experience}
- Πόσες φορές: ${answers.frequency}
- Μπορεί να σταματά ελεγχόμενα: ${answers.canStop}
- Μπορεί να κάνει στροφές: ${answers.canTurn}
- Πίστες που έχει κατέβει: ${answers.slopes}
- Άνεση σε απότομες κατηφόρες: ${answers.steepComfort}

Απάντησε ΜΟΝΟ με ένα JSON object σε αυτή τη μορφή (χωρίς markdown, χωρίς backticks):
{
  "level": "beginner" ή "intermediate" ή "advanced",
  "explanation": "Μίλα ΑΠΕΥΘΕΙΑΣ στον μαθητή σε δεύτερο πρόσωπο,μια σύντομη φιλική εξήγηση ΣΤΑ ΕΛΛΗΝΙΚΑ (2-3 προτάσεις). ΣΗΜΑΝΤΙΚΟ: Χρησιμοποίησε ΜΟΝΟ ελληνικούς χαρακτήρες, ποτέ αραβικά ή κινέζικα ή άλλα αλφάβητα."
}`

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'openai/gpt-oss-120b',
            temperature: 0.7,
        })

        const text = completion.choices[0].message.content
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned)

        res.json(parsed)
    } catch (error) {
        console.error('Groq error:', error.message)
        res.status(500).json({ error: 'Σφάλμα κατά την αξιολόγηση. Δοκίμασε ξανά.' })
    }
}

module.exports = { evaluateLevel }
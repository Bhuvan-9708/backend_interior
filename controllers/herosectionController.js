const HeroSection = require('../model/herosection');

exports.createHerosection = async (req, res) => {
    try {
        const { page, title, text } = req.body;

        const heroSection = await HeroSection.findOneAndUpdate(
            { page },
            { title, text },
            { new: true, upsert: true }
        );

        res.status(200).json(heroSection);
    } catch (error) {
        res.status(500).json({ error: 'Error updating the hero section' });
    }
};

exports.getHerosection = async (req, res) => {
    try {
        const heroSection = await HeroSection.findOne({ page: req.params.page });

        if (!heroSection) {
            return res.status(404).json({ error: 'Hero section not found' });
        }

        res.status(200).json(heroSection);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching the hero section' });
    }
};

const facts = [
    { text: "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.", category: "History" },
    { text: "A day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate on its axis, but only 225 Earth days to orbit the Sun.", category: "Space" },
    { text: "Octopuses have three hearts: one pumps blood through the body, and the other two pump blood to the gills.", category: "Nature" },
    { text: "Bananas are berries, but strawberries aren't. In botanical terms, berries develop from a flower with one ovary, making bananas true berries.", category: "Science" },
    { text: "Wombat poop is cube-shaped. This helps it not roll away as they use it to mark their territory.", category: "Nature" },
    { text: "The Eiffel Tower can be 15 cm taller during the summer inside direct sunlight because the iron structure expands in the heat.", category: "Science" },
    { text: "There are more trees on Earth than stars in the Milky Way. NASA estimates 100-400 billion stars, while there are over 3 trillion trees on Earth.", category: "Space" },
    { text: "Oxford University is older than the Aztec Empire. Oxford started teaching in 1096, while the city of Tenochtitlán was founded in 1325.", category: "History" },
    { text: "It is impossible for most pigs to look up into the sky due to the anatomy of their neck muscles and spine.", category: "Nature" },
    { text: "A jiffy is an actual unit of time measuring 1/100th of a second.", category: "Science" },
    { text: "The shortest war in history lasted only 38 minutes between Britain and Zanzibar on August 27, 1896.", category: "History" },
    { text: "Water makes up about 71% of the Earth's surface, but only 3% of that is fresh water.", category: "Science" },
    { text: "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza.", category: "History" },
    { text: "The longest English word without a true vowel is 'rhythms'.", category: "Language" },
    { text: "There is a single mega-colony of ants that spans three continents: Europe, North America, and Asia.", category: "Nature" },
    { text: "If you shuffle a deck of cards properly, it's highly likely that exact order has never been seen before in history.", category: "Math" }
];

const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const factDisplay = document.getElementById('factDisplay');
const categoryDisplay = document.getElementById('category');

function generateFact() {
    factDisplay.style.opacity = '0';
    factDisplay.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        const random = facts[Math.floor(Math.random() * facts.length)];
        factDisplay.textContent = random.text;
        categoryDisplay.textContent = random.category;
        
        factDisplay.style.transition = 'all 0.3s ease';
        factDisplay.style.opacity = '1';
        factDisplay.style.transform = 'translateY(0)';
    }, 200);
}

generateBtn.addEventListener('click', generateFact);

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(factDisplay.textContent).then(() => {
        const ogIcon = copyBtn.textContent;
        copyBtn.textContent = '✅';
        setTimeout(() => copyBtn.textContent = ogIcon, 1500);
    });
});

window.addEventListener('DOMContentLoaded', generateFact);

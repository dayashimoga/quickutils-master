#!/usr/bin/env node
/**
 * Generate database.json with WTF facts organized by category.
 * Run: node scripts/generate-facts.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { EXTRA_FACTS } = require('./extra-facts');
const { EXTRA_FACTS_2 } = require('./extra-facts-2');
const { EXTRA_FACTS_3 } = require('./extra-facts-3');

const CATEGORIES = [
    'Science', 'History', 'Nature', 'Space', 'Human Body',
    'Animals', 'Technology', 'Food', 'Geography', 'Pop Culture'
];

// Each array element: [fact_text, source_hint]
const FACTS_BY_CATEGORY = {
    Science: [
        ["A teaspoon of a neutron star weighs about 6 billion tons.", "NASA"],
        ["Hot water freezes faster than cold water — this is called the Mpemba effect.", "Royal Society of Chemistry"],
        ["Lightning strikes the Earth about 8 million times per day.", "National Geographic"],
        ["Bananas are naturally radioactive due to their potassium content.", "Physics Central"],
        ["Glass is technically neither a solid nor a liquid — it's an amorphous solid.", "MIT"],
        ["Sound travels about 4.3 times faster in water than in air.", "NOAA"],
        ["A single bolt of lightning contains enough energy to toast 100,000 slices of bread.", "NOAA"],
        ["The human brain generates about 20 watts of electrical power.", "Scientific American"],
        ["If you could fold a piece of paper 42 times, it would reach the moon.", "Mathematics"],
        ["There are more possible iterations of a game of chess than atoms in the observable universe.", "Shannon Number"],
        ["Honey never spoils — edible 3000-year-old honey was found in Egyptian tombs.", "Smithsonian"],
        ["Water can boil and freeze at the same time — it's called the triple point.", "Physics"],
        ["A day on Venus is longer than a year on Venus.", "NASA"],
        ["Atoms are 99.9999999% empty space.", "CERN"],
        ["The smell of rain has a name — it's called petrichor.", "Nature"],
        ["DNA in a single human cell stretches to about 6 feet when uncoiled.", "NIH"],
        ["Diamonds can be made from peanut butter under extreme pressure.", "German Research Centre"],
        ["Mars sunsets appear blue because of the way dust particles scatter light.", "NASA JPL"],
        ["A photon takes 8 minutes to reach Earth from the Sun but 100,000 years to travel from the Sun's core to its surface.", "Stanford"],
        ["The coldest temperature ever recorded in a lab is 0.0000000001 Kelvin.", "Helsinki University"]
    ],
    History: [
        ["Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.", "Timeline"],
        ["Oxford University is older than the Aztec Empire.", "Oxford Archives"],
        ["The shortest war in history lasted 38 minutes — Britain vs Zanzibar in 1896.", "Guinness"],
        ["Napoleon was actually above-average height for his time at 5'7\".", "Historical Records"],
        ["Ancient Romans used crushed mouse brains as toothpaste.", "Pliny the Elder"],
        ["The Great Fire of London in 1666 officially killed only 6 people.", "Museum of London"],
        ["Vikings used to give kittens to new brides as wedding gifts.", "Norse Sagas"],
        ["Abraham Lincoln was a champion wrestler before becoming president.", "National Wrestling HOF"],
        ["The oldest known recipe is for beer, dating back to 4000 BC.", "Sumerian Tablets"],
        ["During WWII, a bear named Wojtek served as a soldier in the Polish army.", "Imperial War Museum"],
        ["The first alarm clock could only ring at 4 AM.", "Levi Hutchins, 1787"],
        ["In 1932, Australia lost a war against emus — the Great Emu War.", "Australian Archives"],
        ["Turkeys were once worshipped as gods by the Mayan civilization.", "Archaeological Records"],
        ["The Eiffel Tower was originally intended to be a temporary structure.", "Gustave Eiffel"],
        ["Ancient Egyptians used slabs of stone as pillows.", "British Museum"],
        ["Genghis Khan killed an estimated 40 million people — about 10% of the world's population.", "Historical Estimates"],
        ["The first computer programmer was Ada Lovelace in 1843.", "Computer History Museum"],
        ["Carrots were originally purple, not orange.", "World Carrot Museum"],
        ["The last execution by guillotine in France was in 1977 — the same year Star Wars came out.", "French Archives"],
        ["Roman gladiators rarely fought to the death — they were too expensive to train.", "Colosseum Studies"]
    ],
    Nature: [
        ["There are more trees on Earth than stars in the Milky Way — about 3 trillion.", "Nature Journal"],
        ["A single tree can absorb about 48 pounds of CO2 per year.", "Arbor Day Foundation"],
        ["Mushrooms are more closely related to humans than to plants.", "Genetics"],
        ["The Amazon rainforest produces about 20% of the world's oxygen.", "WWF"],
        ["Some bamboo species can grow up to 35 inches in a single day.", "Guinness"],
        ["The oldest living tree is over 5,000 years old — a bristlecone pine in California.", "USDA"],
        ["A cloud can weigh over a million pounds.", "USGS"],
        ["Coral reefs support 25% of all marine species but cover less than 1% of the ocean floor.", "NOAA"],
        ["There's a high-pitched sound that only people under 25 can hear — called The Mosquito.", "Acoustics"],
        ["Waterfalls can sometimes flow upward due to strong winds.", "Met Office"],
        ["The Sahara Desert is roughly the same size as the United States.", "Geography"],
        ["90% of all volcanic activity occurs in the ocean.", "USGS"],
        ["Lightning creates temperatures five times hotter than the surface of the Sun.", "NOAA"],
        ["The world's oldest known flower bloomed 130 million years ago.", "Science"],
        ["Some plants can hear themselves being eaten and produce defence chemicals.", "University of Missouri"],
        ["There are about 60,000 miles of blood vessels in the human body.", "NIH"],
        ["A hurricane releases the energy equivalent of 10 atomic bombs per second.", "NOAA"],
        ["The largest living organism on Earth is a honey fungus spanning 2,385 acres.", "USDA"],
        ["Earth's rotation is gradually slowing — days were only 22 hours long 600 million years ago.", "NASA"],
        ["There are more possible configurations of a Rubik's Cube than seconds since the Big Bang.", "Mathematics"]
    ],
    Space: [
        ["There are more stars in the universe than grains of sand on Earth.", "Carl Sagan"],
        ["A year on Mercury is just 88 Earth days.", "NASA"],
        ["If two pieces of the same metal touch in space, they permanently bond — cold welding.", "NASA"],
        ["The footprints on the Moon will last for 100 million years — there's no wind to erode them.", "NASA"],
        ["Neutron stars can spin at a rate of 600 rotations per second.", "NASA"],
        ["Space is completely silent — there's no medium for sound waves to travel through.", "NASA"],
        ["You can fit all the planets in the solar system between Earth and the Moon.", "Astronomy"],
        ["The International Space Station travels at 17,150 mph.", "NASA"],
        ["One million Earths could fit inside the Sun.", "NASA"],
        ["There is a planet made largely of diamonds — 55 Cancri e.", "Yale"],
        ["The Voyager 1 spacecraft is over 14 billion miles from Earth.", "NASA"],
        ["Saturn's density is low enough that it would float in a giant bathtub.", "NASA"],
        ["The largest known star, UY Scuti, has a radius 1,700 times that of our Sun.", "ESO"],
        ["Astronauts grow about 2 inches taller in space due to spinal decompression.", "NASA"],
        ["A space suit costs approximately $12 million.", "NASA"],
        ["The Milky Way and Andromeda galaxies will collide in about 4.5 billion years.", "NASA"],
        ["There is a massive cloud of alcohol in space spanning 288 billion miles.", "NRAO"],
        ["The Sun loses about 4 million tons of mass every second through nuclear fusion.", "NASA"],
        ["Olympus Mons on Mars is nearly three times the height of Mount Everest.", "NASA"],
        ["It rains diamonds on Jupiter and Saturn.", "Nature"]
    ],
    "Human Body": [
        ["Your body produces about 25 million new cells every second.", "NIH"],
        ["The human nose can detect over 1 trillion different scents.", "Science"],
        ["Humans share about 60% of their DNA with bananas.", "Genetics"],
        ["Your stomach gets a new lining every 3-4 days to prevent it from digesting itself.", "NIH"],
        ["The human eye can distinguish approximately 10 million different colors.", "Optical Society"],
        ["Babies are born with about 300 bones, but adults have only 206.", "NIH"],
        ["Your brain uses about 20% of your body's total energy.", "Scientific American"],
        ["Humans are the only animals that blush.", "Darwin"],
        ["The strongest muscle in the human body is the masseter (jaw muscle).", "Dental Research"],
        ["Your body contains about 0.2 mg of gold.", "Chemistry"],
        ["The acid in your stomach is strong enough to dissolve metal.", "NIH"],
        ["Nerve impulses travel at speeds up to 250 mph.", "NIH"],
        ["You produce enough saliva in a lifetime to fill two swimming pools.", "Dental Research"],
        ["Your corneas are the only body part that receives no blood supply.", "Ophthalmology"],
        ["The average human walks the equivalent of 5 times around Earth in a lifetime.", "WHO"],
        ["Human teeth are as strong as shark teeth.", "Dental Research"],
        ["Your body has enough iron to make a 3-inch nail.", "Chemistry"],
        ["The human skeleton replaces itself entirely every 10 years.", "NIH"],
        ["A human sneeze can travel at over 100 mph.", "MIT"],
        ["Your body produces about 1 liter of mucus per day.", "NIH"]
    ],
    Animals: [
        ["Octopuses have three hearts, nine brains, and blue blood.", "Marine Biology"],
        ["A group of flamingos is called a 'flamboyance'.", "Ornithology"],
        ["Cows have best friends and get stressed when separated.", "Animal Behaviour"],
        ["Dolphins sleep with one eye open and one brain hemisphere at a time.", "Marine Biology"],
        ["A shrimp's heart is located in its head.", "Marine Biology"],
        ["Elephants are the only animals that can't jump.", "Zoology"],
        ["A snail can sleep for up to 3 years.", "Nature"],
        ["Hummingbirds are the only birds that can fly backwards.", "Ornithology"],
        ["Sea otters hold hands while sleeping to keep from drifting apart.", "Marine Biology"],
        ["Butterflies taste with their feet.", "Entomology"],
        ["A cockroach can live for a week without its head.", "Entomology"],
        ["Cats have over 20 vocalizations, including the purr, which humans still can't fully explain.", "Zoology"],
        ["The heart of a blue whale is so big a small child could swim through its arteries.", "Marine Biology"],
        ["Pigeons can do math — they can learn abstract numerical rules.", "Science"],
        ["Tardigrades can survive in the vacuum of space.", "Astrobiology"],
        ["A mantis shrimp can punch with the speed of a .22 caliber bullet.", "Nature"],
        ["Crows can recognize individual human faces and hold grudges.", "University of Washington"],
        ["The fingerprints of a koala are virtually indistinguishable from human fingerprints.", "Forensic Science"],
        ["An ostrich's eye is bigger than its brain.", "Zoology"],
        ["Axolotls can regenerate their brain, heart, and limbs.", "Regenerative Biology"]
    ],
    Technology: [
        ["The first ever email was sent by Ray Tomlinson to himself in 1971.", "Computer History"],
        ["More people have mobile phones than have access to clean toilets.", "UN Report"],
        ["The original name for Google was 'BackRub'.", "Google"],
        ["The first 1GB hard drive weighed about 550 pounds and cost $40,000 in 1980.", "IBM"],
        ["About 90% of the world's currency exists only digitally.", "IMF"],
        ["The QWERTY keyboard was designed to slow down typists to prevent jamming.", "Smithsonian"],
        ["The first website ever created is still online — info.cern.ch.", "CERN"],
        ["More than 500 hours of video are uploaded to YouTube every minute.", "YouTube"],
        ["The first computer virus was created in 1983 as an experiment.", "Computer History"],
        ["A single Google search uses more computing power than the entire Apollo 11 mission.", "Google"],
        ["The average smartphone has more computing power than NASA had in 1969.", "NASA"],
        ["WiFi was invented by an Australian radio-astronomer — John O'Sullivan.", "CSIRO"],
        ["Nintendo was founded in 1889 as a playing card company.", "Nintendo"],
        ["The first programmable computer weighed 27 tons — ENIAC (1945).", "University of Pennsylvania"],
        ["About 3.5 billion Google searches are conducted every day.", "Google"],
        ["The first text message ever sent said 'Merry Christmas' in 1992.", "Vodafone"],
        ["The first camera took 8 hours to capture a single photo.", "History of Photography"],
        ["Amazon's Alexa listens to you 24/7 but only records after hearing the wake word.", "Amazon"],
        ["Bitcoin's anonymous creator Satoshi Nakamoto is estimated to own 1 million BTC.", "Blockchain"],
        ["The internet weighs roughly the same as a strawberry — about 50 grams of electrons.", "Discover Magazine"]
    ],
    Food: [
        ["Apples float in water because they are 25% air.", "Food Science"],
        ["Honey is the only food that never spoils.", "Smithsonian"],
        ["Peanuts are one of the ingredients of dynamite.", "Chemistry"],
        ["Strawberries are not berries, but bananas are.", "Botany"],
        ["It takes about 50 licks to finish a single scoop of ice cream.", "Food Engineering"],
        ["Ketchup was once sold as medicine in the 1830s.", "Smithsonian"],
        ["The most expensive coffee in the world comes from cat poop — Kopi Luwak.", "Food Industry"],
        ["Chocolate was once used as currency by the Aztecs.", "Smithsonian"],
        ["Avocados are a fruit, not a vegetable — and they're technically berries.", "Botany"],
        ["The fear of cooking is called Mageirocophobia.", "Psychology"],
        ["A single spaghetti noodle is called a 'spaghetto'.", "Italian Language"],
        ["Potatoes were the first vegetable grown in space.", "NASA"],
        ["Crackers have holes in them to prevent air bubbles during baking.", "Food Science"],
        ["Fortune cookies were invented in San Francisco, not China.", "Historical Records"],
        ["The world's hottest chili pepper — the Carolina Reaper — measures 2.2 million SHU.", "Guinness"],
        ["Nutmeg in large doses is a hallucinogen.", "Pharmacology"],
        ["It takes 12 bees their entire lives to make a single teaspoon of honey.", "Beekeeping"],
        ["Ripe cranberries bounce like rubber balls.", "Food Science"],
        ["White chocolate isn't technically chocolate — it contains no cocoa solids.", "Food Standards"],
        ["Coconut water can be used as a blood plasma substitute in emergencies.", "Medical Research"]
    ],
    Geography: [
        ["Russia spans 11 time zones.", "Geography"],
        ["Canada has more lakes than the rest of the world combined.", "Natural Resources Canada"],
        ["Africa is the only continent that covers all four hemispheres.", "Geography"],
        ["There are more people living inside a 100-mile ring in Asia than outside it.", "Demographics"],
        ["The Dead Sea is so salty that no marine life can survive in it.", "USGS"],
        ["Mount Everest grows about 4mm taller each year due to tectonic activity.", "National Geographic"],
        ["Antarctica is the driest, windiest, and coldest continent.", "British Antarctic Survey"],
        ["There is a city in Turkey called Batman.", "Geography"],
        ["Australia is wider than the Moon.", "Astronomy/Geography"],
        ["The shortest place name in the world is 'Å' — a village in Norway.", "Geography"],
        ["Vatican City is the smallest country in the world at 0.17 square miles.", "CIA World Factbook"],
        ["There's enough gold in Earth's core to coat the planet's surface 1.5 feet deep.", "USGS"],
        ["The Amazon River once flowed in the opposite direction.", "Geology"],
        ["Greenland can't join FIFA because not enough grass grows there for a pitch.", "FIFA"],
        ["The longest place name in the world is in New Zealand — 85 letters.", "Geography"],
        ["There are no rivers in Saudi Arabia.", "Geography"],
        ["Lake Baikal in Russia holds 20% of the world's unfrozen fresh water.", "UNESCO"],
        ["The Mariana Trench is deeper than Mount Everest is tall.", "NOAA"],
        ["France is the most visited country in the world with 90+ million tourists per year.", "UNWTO"],
        ["The Pacific Ocean is larger than all the land on Earth combined.", "NOAA"]
    ],
    "Pop Culture": [
        ["The word 'nerd' was first coined by Dr. Seuss in 1950.", "Dr. Seuss"],
        ["The creator of the Pringles can is buried in one.", "Fred Baur"],
        ["Walt Disney was afraid of mice.", "Disney Archives"],
        ["The shortest Oscar acceptance speech was Patty Duke's — just two words: 'Thank you.'", "Academy"],
        ["Mario from Nintendo was originally called 'Jumpman'.", "Nintendo"],
        ["The longest movie ever made is 857 hours long — 'Logistics' (2012).", "Film Records"],
        ["Monopoly was originally invented to demonstrate the evils of capitalism.", "Smithsonian"],
        ["Mr. Rogers' sweaters were all knitted by his mother.", "PBS"],
        ["'Jaws' made Steven Spielberg afraid to swim in the ocean.", "Interviews"],
        ["The word 'emoji' comes from Japanese — 'e' (picture) + 'moji' (character).", "Linguistics"],
        ["The Mona Lisa has her own mailbox at the Louvre due to all the love letters she receives.", "Louvre"],
        ["Pac-Man was designed to look like a pizza with a slice removed.", "Namco"],
        ["The world's best-selling book of all time (after the Bible) is Don Quixote.", "Publishing"],
        ["LEGO is the world's largest tire manufacturer by number of tires produced.", "LEGO"],
        ["The hashtag symbol (#) is technically called an octothorpe.", "Linguistics"],
        ["'Twinkle Twinkle Little Star' and the Alphabet Song have the same melody.", "Music"],
        ["Barbie's full name is Barbara Millicent Roberts.", "Mattel"],
        ["The voice of Mickey Mouse and Minnie Mouse got married in real life.", "Disney"],
        ["A 'jiffy' is an actual unit of time — 1/100th of a second.", "Physics"],
        ["The first ever YouTube video was uploaded on April 23, 2005 — titled 'Me at the zoo'.", "YouTube"]
    ]
};

function generateDatabase() {
    const facts = [];
    let id = 1;
    for (const category of CATEGORIES) {
        const combined = [
            ...(FACTS_BY_CATEGORY[category] || /* istanbul ignore next */[]),
            ...(EXTRA_FACTS[category] || /* istanbul ignore next */[]),
            ...(EXTRA_FACTS_2[category] || /* istanbul ignore next */[]),
            ...(EXTRA_FACTS_3[category] || /* istanbul ignore next */[])
        ];
        for (const [text, source] of combined) {
            facts.push({ id: id++, text, category, source });
        }
    }
    return facts;
}

const outputDir = path.join(__dirname, '..', 'data');
/* istanbul ignore next */
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const facts = generateDatabase();
fs.writeFileSync(
    path.join(outputDir, 'database.json'),
    JSON.stringify(facts, null, 2)
);
console.log(`✅ Generated ${facts.length} facts in data/database.json`);

// Export for testing
/* istanbul ignore next */
if (typeof module !== 'undefined') {
    module.exports = { generateDatabase, CATEGORIES, FACTS_BY_CATEGORY, EXTRA_FACTS, EXTRA_FACTS_2, EXTRA_FACTS_3 };
}

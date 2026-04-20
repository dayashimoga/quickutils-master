(() => {
'use strict';
const $ = s => document.querySelector(s);

// Full detailed dataset of all 118 elements
const elements = [
    {
        "n": 1,
        "s": "H",
        "name": "Hydrogen",
        "c": "reactive_nonmetal",
        "group": 1,
        "period": 1,
        "mass": 1.008,
        "ec": "1s1",
        "desc": "The lightest and most abundant element in the universe."
    },
    {
        "n": 2,
        "s": "He",
        "name": "Helium",
        "c": "noble_gas",
        "group": 18,
        "period": 1,
        "mass": 4.0026,
        "ec": "1s2",
        "desc": "A colorless, odorless, inert monatomic noble gas."
    },
    {
        "n": 3,
        "s": "Li",
        "name": "Lithium",
        "c": "alkali_metal",
        "group": 1,
        "period": 2,
        "mass": 6.94,
        "ec": "[He] 2s1",
        "desc": "A soft, silvery-white alkali metal."
    },
    {
        "n": 4,
        "s": "Be",
        "name": "Beryllium",
        "c": "alkaline_earth_metal",
        "group": 2,
        "period": 2,
        "mass": 9.0122,
        "ec": "[He] 2s2",
        "desc": "A relatively rare alkaline earth metal."
    },
    {
        "n": 5,
        "s": "B",
        "name": "Boron",
        "c": "metalloid",
        "group": 13,
        "period": 2,
        "mass": 10.81,
        "ec": "[He] 2s2 2p1",
        "desc": "A metalloid found largely in cosmic ray spallation."
    },
    {
        "n": 6,
        "s": "C",
        "name": "Carbon",
        "c": "reactive_nonmetal",
        "group": 14,
        "period": 2,
        "mass": 12.011,
        "ec": "[He] 2s2 2p2",
        "desc": "The basis of all known life on Earth."
    },
    {
        "n": 7,
        "s": "N",
        "name": "Nitrogen",
        "c": "reactive_nonmetal",
        "group": 15,
        "period": 2,
        "mass": 14.007,
        "ec": "[He] 2s2 2p3",
        "desc": "Makes up 78% of the Earth\u2019s atmosphere."
    },
    {
        "n": 8,
        "s": "O",
        "name": "Oxygen",
        "c": "reactive_nonmetal",
        "group": 16,
        "period": 2,
        "mass": 15.999,
        "ec": "[He] 2s2 2p4",
        "desc": "Essential for respiration for most living organisms."
    },
    {
        "n": 9,
        "s": "F",
        "name": "Fluorine",
        "c": "halogen",
        "group": 17,
        "period": 2,
        "mass": 18.998,
        "ec": "[He] 2s2 2p5",
        "desc": "The most electronegative and reactive of all elements."
    },
    {
        "n": 10,
        "s": "Ne",
        "name": "Neon",
        "c": "noble_gas",
        "group": 18,
        "period": 2,
        "mass": 20.18,
        "ec": "[He] 2s2 2p6",
        "desc": "Gives a distinct reddish-orange glow when used in low-voltage neon glow lamps."
    },
    {
        "n": 11,
        "s": "Na",
        "name": "Sodium",
        "c": "alkali_metal",
        "group": 1,
        "period": 3,
        "mass": 22.99,
        "ec": "[Ne] 3s1",
        "desc": "A soft, silvery-white, highly reactive metal."
    },
    {
        "n": 12,
        "s": "Mg",
        "name": "Magnesium",
        "c": "alkaline_earth_metal",
        "group": 2,
        "period": 3,
        "mass": 24.305,
        "ec": "[Ne] 3s2",
        "desc": "A shiny gray solid used in lightweight alloys."
    },
    {
        "n": 13,
        "s": "Al",
        "name": "Aluminum",
        "c": "post_transition_metal",
        "group": 13,
        "period": 3,
        "mass": 26.982,
        "ec": "[Ne] 3s2 3p1",
        "desc": "The most widely used non-ferrous metal."
    },
    {
        "n": 14,
        "s": "Si",
        "name": "Silicon",
        "c": "metalloid",
        "group": 14,
        "period": 3,
        "mass": 28.085,
        "ec": "[Ne] 3s2 3p2",
        "desc": "A crucial semiconductor in microelectronics."
    },
    {
        "n": 15,
        "s": "P",
        "name": "Phosphorus",
        "c": "reactive_nonmetal",
        "group": 15,
        "period": 3,
        "mass": 30.974,
        "ec": "[Ne] 3s2 3p3",
        "desc": "Essential for life, primarily found in DNA and ATP."
    },
    {
        "n": 16,
        "s": "S",
        "name": "Sulfur",
        "c": "reactive_nonmetal",
        "group": 16,
        "period": 3,
        "mass": 32.06,
        "ec": "[Ne] 3s2 3p4",
        "desc": "A bright yellow crystalline solid at room temperature."
    },
    {
        "n": 17,
        "s": "Cl",
        "name": "Chlorine",
        "c": "halogen",
        "group": 17,
        "period": 3,
        "mass": 35.45,
        "ec": "[Ne] 3s2 3p5",
        "desc": "A yellow-green gas, commonly used as a disinfectant."
    },
    {
        "n": 18,
        "s": "Ar",
        "name": "Argon",
        "c": "noble_gas",
        "group": 18,
        "period": 3,
        "mass": 39.95,
        "ec": "[Ne] 3s2 3p6",
        "desc": "The third most abundant gas in the atmosphere."
    },
    {
        "n": 19,
        "s": "K",
        "name": "Potassium",
        "c": "alkali_metal",
        "group": 1,
        "period": 4,
        "mass": 39.098,
        "ec": "[Ar] 4s1",
        "desc": "A silvery-white metal that reacts vigorously with water."
    },
    {
        "n": 20,
        "s": "Ca",
        "name": "Calcium",
        "c": "alkaline_earth_metal",
        "group": 2,
        "period": 4,
        "mass": 40.078,
        "ec": "[Ar] 4s2",
        "desc": "Vital for bone structure and shell formation."
    },
    {
        "n": 21,
        "s": "Sc",
        "name": "Scandium",
        "c": "transition_metal",
        "group": 3,
        "period": 4,
        "mass": 44.956,
        "ec": "[Ar] 3d1 4s2",
        "desc": "Used in aerospace components and sports materials."
    },
    {
        "n": 22,
        "s": "Ti",
        "name": "Titanium",
        "c": "transition_metal",
        "group": 4,
        "period": 4,
        "mass": 47.867,
        "ec": "[Ar] 3d2 4s2",
        "desc": "Known for its high strength-to-weight ratio and corrosion resistance."
    },
    {
        "n": 23,
        "s": "V",
        "name": "Vanadium",
        "c": "transition_metal",
        "group": 5,
        "period": 4,
        "mass": 50.942,
        "ec": "[Ar] 3d3 4s2",
        "desc": "Primarily used to produce specialty steel alloys."
    },
    {
        "n": 24,
        "s": "Cr",
        "name": "Chromium",
        "c": "transition_metal",
        "group": 6,
        "period": 4,
        "mass": 51.996,
        "ec": "[Ar] 3d5 4s1",
        "desc": "Used for stainless steel and chrome plating."
    },
    {
        "n": 25,
        "s": "Mn",
        "name": "Manganese",
        "c": "transition_metal",
        "group": 7,
        "period": 4,
        "mass": 54.938,
        "ec": "[Ar] 3d5 4s2",
        "desc": "Essential for iron and steel production."
    },
    {
        "n": 26,
        "s": "Fe",
        "name": "Iron",
        "c": "transition_metal",
        "group": 8,
        "period": 4,
        "mass": 55.845,
        "ec": "[Ar] 3d6 4s2",
        "desc": "The most common element on Earth by mass, forming much of Earths outer and inner core."
    },
    {
        "n": 27,
        "s": "Co",
        "name": "Cobalt",
        "c": "transition_metal",
        "group": 9,
        "period": 4,
        "mass": 58.933,
        "ec": "[Ar] 3d7 4s2",
        "desc": "Used in the preparation of magnetic, wear-resistant and high-strength alloys."
    },
    {
        "n": 28,
        "s": "Ni",
        "name": "Nickel",
        "c": "transition_metal",
        "group": 10,
        "period": 4,
        "mass": 58.693,
        "ec": "[Ar] 3d8 4s2",
        "desc": "A silvery-white lustrous metal with a slight golden tinge."
    },
    {
        "n": 29,
        "s": "Cu",
        "name": "Copper",
        "c": "transition_metal",
        "group": 11,
        "period": 4,
        "mass": 63.546,
        "ec": "[Ar] 3d10 4s1",
        "desc": "A soft, malleable, and ductile metal with very high thermal and electrical conductivity."
    },
    {
        "n": 30,
        "s": "Zn",
        "name": "Zinc",
        "c": "transition_metal",
        "group": 12,
        "period": 4,
        "mass": 65.38,
        "ec": "[Ar] 3d10 4s2",
        "desc": "Used primarily to galvanize iron and steel."
    },
    {
        "n": 31,
        "s": "Ga",
        "name": "Gallium",
        "c": "post_transition_metal",
        "group": 13,
        "period": 4,
        "mass": 69.723,
        "ec": "[Ar] 3d10 4s2 4p1",
        "desc": "Melts just above room temperature."
    },
    {
        "n": 32,
        "s": "Ge",
        "name": "Germanium",
        "c": "metalloid",
        "group": 14,
        "period": 4,
        "mass": 72.63,
        "ec": "[Ar] 3d10 4s2 4p2",
        "desc": "An important semiconductor material."
    },
    {
        "n": 33,
        "s": "As",
        "name": "Arsenic",
        "c": "metalloid",
        "group": 15,
        "period": 4,
        "mass": 74.922,
        "ec": "[Ar] 3d10 4s2 4p3",
        "desc": "Famously toxic, but used in some semiconductors."
    },
    {
        "n": 34,
        "s": "Se",
        "name": "Selenium",
        "c": "reactive_nonmetal",
        "group": 16,
        "period": 4,
        "mass": 78.971,
        "ec": "[Ar] 3d10 4s2 4p4",
        "desc": "Used in glassmaking and pigments."
    },
    {
        "n": 35,
        "s": "Br",
        "name": "Bromine",
        "c": "halogen",
        "group": 17,
        "period": 4,
        "mass": 79.904,
        "ec": "[Ar] 3d10 4s2 4p5",
        "desc": "A fuming red-brown liquid at room temperature."
    },
    {
        "n": 36,
        "s": "Kr",
        "name": "Krypton",
        "c": "noble_gas",
        "group": 18,
        "period": 4,
        "mass": 83.798,
        "ec": "[Ar] 3d10 4s2 4p6",
        "desc": "Used in fluorescent lamps."
    },
    {
        "n": 37,
        "s": "Rb",
        "name": "Rubidium",
        "c": "alkali_metal",
        "group": 1,
        "period": 5,
        "mass": 85.468,
        "ec": "[Kr] 5s1",
        "desc": "A very soft, silvery-white alkali metal."
    },
    {
        "n": 38,
        "s": "Sr",
        "name": "Strontium",
        "c": "alkaline_earth_metal",
        "group": 2,
        "period": 5,
        "mass": 87.62,
        "ec": "[Kr] 5s2",
        "desc": "Used in fireworks to produce a red color."
    },
    {
        "n": 39,
        "s": "Y",
        "name": "Yttrium",
        "c": "transition_metal",
        "group": 3,
        "period": 5,
        "mass": 88.906,
        "ec": "[Kr] 4d1 5s2",
        "desc": "Used in LEDs and phosphors."
    },
    {
        "n": 40,
        "s": "Zr",
        "name": "Zirconium",
        "c": "transition_metal",
        "group": 4,
        "period": 5,
        "mass": 91.224,
        "ec": "[Kr] 4d2 5s2",
        "desc": "Highly resistant to corrosion, used in nuclear reactors."
    },
    {
        "n": 41,
        "s": "Nb",
        "name": "Niobium",
        "c": "transition_metal",
        "group": 5,
        "period": 5,
        "mass": 92.906,
        "ec": "[Kr] 4d4 5s1",
        "desc": "Used in superconducting materials."
    },
    {
        "n": 42,
        "s": "Mo",
        "name": "Molybdenum",
        "c": "transition_metal",
        "group": 6,
        "period": 5,
        "mass": 95.95,
        "ec": "[Kr] 4d5 5s1",
        "desc": "Used in high-strength steel alloys."
    },
    {
        "n": 43,
        "s": "Tc",
        "name": "Technetium",
        "c": "transition_metal",
        "group": 7,
        "period": 5,
        "mass": 98.0,
        "ec": "[Kr] 4d5 5s2",
        "desc": "The lightest element whose isotopes are all radioactive."
    },
    {
        "n": 44,
        "s": "Ru",
        "name": "Ruthenium",
        "c": "transition_metal",
        "group": 8,
        "period": 5,
        "mass": 101.07,
        "ec": "[Kr] 4d7 5s1",
        "desc": "A rare transition metal in the platinum group."
    },
    {
        "n": 45,
        "s": "Rh",
        "name": "Rhodium",
        "c": "transition_metal",
        "group": 9,
        "period": 5,
        "mass": 102.91,
        "ec": "[Kr] 4d8 5s1",
        "desc": "One of the rarest and most valuable precious metals."
    },
    {
        "n": 46,
        "s": "Pd",
        "name": "Palladium",
        "c": "transition_metal",
        "group": 10,
        "period": 5,
        "mass": 106.42,
        "ec": "[Kr] 4d10",
        "desc": "Used extensively in catalytic converters."
    },
    {
        "n": 47,
        "s": "Ag",
        "name": "Silver",
        "c": "transition_metal",
        "group": 11,
        "period": 5,
        "mass": 107.87,
        "ec": "[Kr] 4d10 5s1",
        "desc": "Has the highest electrical conductivity of any element."
    },
    {
        "n": 48,
        "s": "Cd",
        "name": "Cadmium",
        "c": "transition_metal",
        "group": 12,
        "period": 5,
        "mass": 112.41,
        "ec": "[Kr] 4d10 5s2",
        "desc": "Historically used in batteries and pigments."
    },
    {
        "n": 49,
        "s": "In",
        "name": "Indium",
        "c": "post_transition_metal",
        "group": 13,
        "period": 5,
        "mass": 114.82,
        "ec": "[Kr] 4d10 5s2 5p1",
        "desc": "Used in indium tin oxide for touch screens."
    },
    {
        "n": 50,
        "s": "Sn",
        "name": "Tin",
        "c": "post_transition_metal",
        "group": 14,
        "period": 5,
        "mass": 118.71,
        "ec": "[Kr] 4d10 5s2 5p2",
        "desc": "Used to coat other metals to prevent corrosion."
    },
    {
        "n": 51,
        "s": "Sb",
        "name": "Antimony",
        "c": "metalloid",
        "group": 15,
        "period": 5,
        "mass": 121.76,
        "ec": "[Kr] 4d10 5s2 5p3",
        "desc": "Used in flame retardants and alloys."
    },
    {
        "n": 52,
        "s": "Te",
        "name": "Tellurium",
        "c": "metalloid",
        "group": 16,
        "period": 5,
        "mass": 127.6,
        "ec": "[Kr] 4d10 5s2 5p4",
        "desc": "Used in cadmium telluride solar panels."
    },
    {
        "n": 53,
        "s": "I",
        "name": "Iodine",
        "c": "halogen",
        "group": 17,
        "period": 5,
        "mass": 126.9,
        "ec": "[Kr] 4d10 5s2 5p5",
        "desc": "Essential for human nutrition (thyroid function)."
    },
    {
        "n": 54,
        "s": "Xe",
        "name": "Xenon",
        "c": "noble_gas",
        "group": 18,
        "period": 5,
        "mass": 131.29,
        "ec": "[Kr] 4d10 5s2 5p6",
        "desc": "Used in flash lamps and arc lamps."
    },
    {
        "n": 55,
        "s": "Cs",
        "name": "Cesium",
        "c": "alkali_metal",
        "group": 1,
        "period": 6,
        "mass": 132.91,
        "ec": "[Xe] 6s1",
        "desc": "Used in atomic clocks."
    },
    {
        "n": 56,
        "s": "Ba",
        "name": "Barium",
        "c": "alkaline_earth_metal",
        "group": 2,
        "period": 6,
        "mass": 137.33,
        "ec": "[Xe] 6s2",
        "desc": "Used in spark plugs and vacuum tubes."
    },
    {
        "n": 57,
        "s": "La",
        "name": "Lanthanum",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 138.91,
        "ec": "[Xe] 5d1 6s2",
        "desc": "First of the lanthanide series."
    },
    {
        "n": 58,
        "s": "Ce",
        "name": "Cerium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 140.12,
        "ec": "[Xe] 4f1 5d1 6s2",
        "desc": "The most abundant of the rare earth metals."
    },
    {
        "n": 59,
        "s": "Pr",
        "name": "Praseodymium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 140.91,
        "ec": "[Xe] 4f3 6s2",
        "desc": "Used in high-power magnets."
    },
    {
        "n": 60,
        "s": "Nd",
        "name": "Neodymium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 144.24,
        "ec": "[Xe] 4f4 6s2",
        "desc": "Used to make the strongest permanent magnets."
    },
    {
        "n": 61,
        "s": "Pm",
        "name": "Promethium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 145.0,
        "ec": "[Xe] 4f5 6s2",
        "desc": "All isotopes are radioactive."
    },
    {
        "n": 62,
        "s": "Sm",
        "name": "Samarium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 150.36,
        "ec": "[Xe] 4f6 6s2",
        "desc": "Used in samarium-cobalt magnets."
    },
    {
        "n": 63,
        "s": "Eu",
        "name": "Europium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 151.96,
        "ec": "[Xe] 4f7 6s2",
        "desc": "Used extensively as a red phosphor in displays."
    },
    {
        "n": 64,
        "s": "Gd",
        "name": "Gadolinium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 157.25,
        "ec": "[Xe] 4f7 5d1 6s2",
        "desc": "Used as an MRI contrast agent."
    },
    {
        "n": 65,
        "s": "Tb",
        "name": "Terbium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 158.93,
        "ec": "[Xe] 4f9 6s2",
        "desc": "Used in solid-state devices and green phosphors."
    },
    {
        "n": 66,
        "s": "Dy",
        "name": "Dysprosium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 162.5,
        "ec": "[Xe] 4f10 6s2",
        "desc": "Has one of the highest magnetic strengths of the elements."
    },
    {
        "n": 67,
        "s": "Ho",
        "name": "Holmium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 164.93,
        "ec": "[Xe] 4f11 6s2",
        "desc": "Has the highest magnetic strength of any element."
    },
    {
        "n": 68,
        "s": "Er",
        "name": "Erbium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 167.26,
        "ec": "[Xe] 4f12 6s2",
        "desc": "Used in fiber optic amplifiers."
    },
    {
        "n": 69,
        "s": "Tm",
        "name": "Thulium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 168.93,
        "ec": "[Xe] 4f13 6s2",
        "desc": "One of the rarest of the rare earths."
    },
    {
        "n": 70,
        "s": "Yb",
        "name": "Ytterbium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 173.05,
        "ec": "[Xe] 4f14 6s2",
        "desc": "Used in solid state lasers."
    },
    {
        "n": 71,
        "s": "Lu",
        "name": "Lutetium",
        "c": "lanthanide",
        "group": 3,
        "period": 6,
        "mass": 174.97,
        "ec": "[Xe] 4f14 5d1 6s2",
        "desc": "The last element in the lanthanide series."
    },
    {
        "n": 72,
        "s": "Hf",
        "name": "Hafnium",
        "c": "transition_metal",
        "group": 4,
        "period": 6,
        "mass": 178.49,
        "ec": "[Xe] 4f14 5d2 6s2",
        "desc": "Used in control rods for nuclear reactors."
    },
    {
        "n": 73,
        "s": "Ta",
        "name": "Tantalum",
        "c": "transition_metal",
        "group": 5,
        "period": 6,
        "mass": 180.95,
        "ec": "[Xe] 4f14 5d3 6s2",
        "desc": "Widely used in electronic capacitors."
    },
    {
        "n": 74,
        "s": "W",
        "name": "Tungsten",
        "c": "transition_metal",
        "group": 6,
        "period": 6,
        "mass": 183.84,
        "ec": "[Xe] 4f14 5d4 6s2",
        "desc": "Has the highest melting point of all elements."
    },
    {
        "n": 75,
        "s": "Re",
        "name": "Rhenium",
        "c": "transition_metal",
        "group": 7,
        "period": 6,
        "mass": 186.21,
        "ec": "[Xe] 4f14 5d5 6s2",
        "desc": "Used in high-temperature superalloys for jet engines."
    },
    {
        "n": 76,
        "s": "Os",
        "name": "Osmium",
        "c": "transition_metal",
        "group": 8,
        "period": 6,
        "mass": 190.23,
        "ec": "[Xe] 4f14 5d6 6s2",
        "desc": "The densest naturally occurring element."
    },
    {
        "n": 77,
        "s": "Ir",
        "name": "Iridium",
        "c": "transition_metal",
        "group": 9,
        "period": 6,
        "mass": 192.22,
        "ec": "[Xe] 4f14 5d7 6s2",
        "desc": "Provides evidence for the dinosaur-killing meteor impact."
    },
    {
        "n": 78,
        "s": "Pt",
        "name": "Platinum",
        "c": "transition_metal",
        "group": 10,
        "period": 6,
        "mass": 195.08,
        "ec": "[Xe] 4f14 5d9 6s1",
        "desc": "Valued for jewelry and as an industrial catalyst."
    },
    {
        "n": 79,
        "s": "Au",
        "name": "Gold",
        "c": "transition_metal",
        "group": 11,
        "period": 6,
        "mass": 196.97,
        "ec": "[Xe] 4f14 5d10 6s1",
        "desc": "Highly valued precious metal since ancient times."
    },
    {
        "n": 80,
        "s": "Hg",
        "name": "Mercury",
        "c": "transition_metal",
        "group": 12,
        "period": 6,
        "mass": 200.59,
        "ec": "[Xe] 4f14 5d10 6s2",
        "desc": "The only metal that is liquid at standard conditions."
    },
    {
        "n": 81,
        "s": "Tl",
        "name": "Thallium",
        "c": "post_transition_metal",
        "group": 13,
        "period": 6,
        "mass": 204.38,
        "ec": "[Xe] 4f14 5d10 6s2 6p1",
        "desc": "Highly toxic, formerly used in rat poison."
    },
    {
        "n": 82,
        "s": "Pb",
        "name": "Lead",
        "c": "post_transition_metal",
        "group": 14,
        "period": 6,
        "mass": 207.2,
        "ec": "[Xe] 4f14 5d10 6s2 6p2",
        "desc": "A heavy metal used in bullets and radiation shielding."
    },
    {
        "n": 83,
        "s": "Bi",
        "name": "Bismuth",
        "c": "post_transition_metal",
        "group": 15,
        "period": 6,
        "mass": 208.98,
        "ec": "[Xe] 4f14 5d10 6s2 6p3",
        "desc": "A brittle metal with unusually low toxicity."
    },
    {
        "n": 84,
        "s": "Po",
        "name": "Polonium",
        "c": "post_transition_metal",
        "group": 16,
        "period": 6,
        "mass": 209,
        "ec": "[Xe] 4f14 5d10 6s2 6p4",
        "desc": "A highly radioactive metal discovered by Marie Curie."
    },
    {
        "n": 85,
        "s": "At",
        "name": "Astatine",
        "c": "halogen",
        "group": 17,
        "period": 6,
        "mass": 210,
        "ec": "[Xe] 4f14 5d10 6s2 6p5",
        "desc": "Extremely rare and radioactive halogen."
    },
    {
        "n": 86,
        "s": "Rn",
        "name": "Radon",
        "c": "noble_gas",
        "group": 18,
        "period": 6,
        "mass": 222,
        "ec": "[Xe] 4f14 5d10 6s2 6p6",
        "desc": "A radioactive, colorless, odorless, tasteless noble gas."
    },
    {
        "n": 87,
        "s": "Fr",
        "name": "Francium",
        "c": "alkali_metal",
        "group": 1,
        "period": 7,
        "mass": 223,
        "ec": "[Rn] 7s1",
        "desc": "Highly radioactive and very rare alkali metal."
    },
    {
        "n": 88,
        "s": "Ra",
        "name": "Radium",
        "c": "alkaline_earth_metal",
        "group": 2,
        "period": 7,
        "mass": 226,
        "ec": "[Rn] 7s2",
        "desc": "Used historically in luminous paints before its hazards were known."
    },
    {
        "n": 89,
        "s": "Ac",
        "name": "Actinium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 227,
        "ec": "[Rn] 6d1 7s2",
        "desc": "First of the actinide series."
    },
    {
        "n": 90,
        "s": "Th",
        "name": "Thorium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 232.04,
        "ec": "[Rn] 6d2 7s2",
        "desc": "Estimated to be about three and a half times as abundant as uranium."
    },
    {
        "n": 91,
        "s": "Pa",
        "name": "Protactinium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 231.04,
        "ec": "[Rn] 5f2 6d1 7s2",
        "desc": "A rare, highly radioactive actinide."
    },
    {
        "n": 92,
        "s": "U",
        "name": "Uranium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 238.03,
        "ec": "[Rn] 5f3 6d1 7s2",
        "desc": "Used primarily as fuel in nuclear power plants."
    },
    {
        "n": 93,
        "s": "Np",
        "name": "Neptunium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 237,
        "ec": "[Rn] 5f4 6d1 7s2",
        "desc": "The first transuranic element, discovered in 1940."
    },
    {
        "n": 94,
        "s": "Pu",
        "name": "Plutonium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 244,
        "ec": "[Rn] 5f6 7s2",
        "desc": "Used in nuclear weapons and RTGs for spacecraft."
    },
    {
        "n": 95,
        "s": "Am",
        "name": "Americium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 243,
        "ec": "[Rn] 5f7 7s2",
        "desc": "Commonly used in commercial smoke detectors."
    },
    {
        "n": 96,
        "s": "Cm",
        "name": "Curium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 247,
        "ec": "[Rn] 5f7 6d1 7s2",
        "desc": "Named after Marie and Pierre Curie."
    },
    {
        "n": 97,
        "s": "Bk",
        "name": "Berkelium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 247,
        "ec": "[Rn] 5f9 7s2",
        "desc": "Named after the city of Berkeley, California."
    },
    {
        "n": 98,
        "s": "Cf",
        "name": "Californium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 251,
        "ec": "[Rn] 5f10 7s2",
        "desc": "Used in portable metal detectors and cancer treatment."
    },
    {
        "n": 99,
        "s": "Es",
        "name": "Einsteinium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 252,
        "ec": "[Rn] 5f11 7s2",
        "desc": "Named in honor of Albert Einstein."
    },
    {
        "n": 100,
        "s": "Fm",
        "name": "Fermium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 257,
        "ec": "[Rn] 5f12 7s2",
        "desc": "Named in honor of Enrico Fermi."
    },
    {
        "n": 101,
        "s": "Md",
        "name": "Mendelevium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 258,
        "ec": "[Rn] 5f13 7s2",
        "desc": "Named in honor of Dmitri Mendeleev."
    },
    {
        "n": 102,
        "s": "No",
        "name": "Nobelium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 259,
        "ec": "[Rn] 5f14 7s2",
        "desc": "Named in honor of Alfred Nobel."
    },
    {
        "n": 103,
        "s": "Lr",
        "name": "Lawrencium",
        "c": "actinide",
        "group": 3,
        "period": 7,
        "mass": 266,
        "ec": "[Rn] 5f14 7s2 7p1",
        "desc": "Named in honor of Ernest Lawrence."
    },
    {
        "n": 104,
        "s": "Rf",
        "name": "Rutherfordium",
        "c": "transition_metal",
        "group": 4,
        "period": 7,
        "mass": 267,
        "ec": "[Rn] 5f14 6d2 7s2",
        "desc": "A synthetic chemical element."
    },
    {
        "n": 105,
        "s": "Db",
        "name": "Dubnium",
        "c": "transition_metal",
        "group": 5,
        "period": 7,
        "mass": 268,
        "ec": "[Rn] 5f14 6d3 7s2",
        "desc": "Named after the Russian town of Dubna."
    },
    {
        "n": 106,
        "s": "Sg",
        "name": "Seaborgium",
        "c": "transition_metal",
        "group": 6,
        "period": 7,
        "mass": 269,
        "ec": "[Rn] 5f14 6d4 7s2",
        "desc": "Named after Glenn T. Seaborg."
    },
    {
        "n": 107,
        "s": "Bh",
        "name": "Bohrium",
        "c": "transition_metal",
        "group": 7,
        "period": 7,
        "mass": 270,
        "ec": "[Rn] 5f14 6d5 7s2",
        "desc": "Named in honor of Niels Bohr."
    },
    {
        "n": 108,
        "s": "Hs",
        "name": "Hassium",
        "c": "transition_metal",
        "group": 8,
        "period": 7,
        "mass": 277,
        "ec": "[Rn] 5f14 6d6 7s2",
        "desc": "Named after the German state of Hesse."
    },
    {
        "n": 109,
        "s": "Mt",
        "name": "Meitnerium",
        "c": "transition_metal",
        "group": 9,
        "period": 7,
        "mass": 278,
        "ec": "[Rn] 5f14 6d7 7s2",
        "desc": "Named in honor of Lise Meitner."
    },
    {
        "n": 110,
        "s": "Ds",
        "name": "Darmstadtium",
        "c": "transition_metal",
        "group": 10,
        "period": 7,
        "mass": 281,
        "ec": "[Rn] 5f14 6d8 7s2",
        "desc": "Named after the German city of Darmstadt."
    },
    {
        "n": 111,
        "s": "Rg",
        "name": "Roentgenium",
        "c": "transition_metal",
        "group": 11,
        "period": 7,
        "mass": 282,
        "ec": "[Rn] 5f14 6d9 7s2",
        "desc": "Named in honor of Wilhelm R\u00f6ntgen."
    },
    {
        "n": 112,
        "s": "Cn",
        "name": "Copernicium",
        "c": "transition_metal",
        "group": 12,
        "period": 7,
        "mass": 285,
        "ec": "[Rn] 5f14 6d10 7s2",
        "desc": "Named in honor of Nicolaus Copernicus."
    },
    {
        "n": 113,
        "s": "Nh",
        "name": "Nihonium",
        "c": "post_transition_metal",
        "group": 13,
        "period": 7,
        "mass": 286,
        "ec": "[Rn] 5f14 6d10 7s2 7p1",
        "desc": "Named after Nihon, the Japanese word for Japan."
    },
    {
        "n": 114,
        "s": "Fl",
        "name": "Flerovium",
        "c": "post_transition_metal",
        "group": 14,
        "period": 7,
        "mass": 289,
        "ec": "[Rn] 5f14 6d10 7s2 7p2",
        "desc": "Named after the Flerov Laboratory of Nuclear Reactions."
    },
    {
        "n": 115,
        "s": "Mc",
        "name": "Moscovium",
        "c": "post_transition_metal",
        "group": 15,
        "period": 7,
        "mass": 290,
        "ec": "[Rn] 5f14 6d10 7s2 7p3",
        "desc": "Named after the Moscow region in Russia."
    },
    {
        "n": 116,
        "s": "Lv",
        "name": "Livermorium",
        "c": "post_transition_metal",
        "group": 16,
        "period": 7,
        "mass": 293,
        "ec": "[Rn] 5f14 6d10 7s2 7p4",
        "desc": "Named after the Lawrence Livermore National Laboratory."
    },
    {
        "n": 117,
        "s": "Ts",
        "name": "Tennessine",
        "c": "halogen",
        "group": 17,
        "period": 7,
        "mass": 294,
        "ec": "[Rn] 5f14 6d10 7s2 7p5",
        "desc": "Named after the state of Tennessee."
    },
    {
        "n": 118,
        "s": "Og",
        "name": "Oganesson",
        "c": "noble_gas",
        "group": 18,
        "period": 7,
        "mass": 294,
        "ec": "[Rn] 5f14 6d10 7s2 7p6",
        "desc": "Named in honor of Russian physicist Yuri Oganessian."
    }
];


const CATEGORIES = {
    alkali_metal: { name: 'Alkali Metal', color: 'var(--c-alkali)' },
    alkaline_earth_metal: { name: 'Alkaline Earth Metal', color: 'var(--c-alkaline)' },
    transition_metal: { name: 'Transition Metal', color: 'var(--c-transition)' },
    post_transition_metal: { name: 'Post-Transition Metal', color: 'var(--c-post-transition)' },
    metalloid: { name: 'Metalloid', color: 'var(--c-metalloid)' },
    reactive_nonmetal: { name: 'Reactive Nonmetal', color: 'var(--c-nonmetal)' },
    noble_gas: { name: 'Noble Gas', color: 'var(--c-noble)' },
    halogen: { name: 'Halogen', color: 'var(--c-halogen)' },
    lanthanide: { name: 'Lanthanide', color: 'var(--c-lanthanide)' },
    actinide: { name: 'Actinide', color: 'var(--c-actinide)' },
    unknown: { name: 'Unknown', color: 'var(--c-unknown)' },
};

function renderGrid() {
    const grid = $('#periodicTable');
    let html = '';
    
    // We render a 18x10 grid. Rows 1-7 are standard. Row 8 is space, Row 9 is Lanthanide, Row 10 is Actinide.
    for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 18; c++) {
            let el = null;
            if (r <= 7) el = elements.find(x => x.period === r && x.group === c);
            else if (r === 9 && c >= 3 && c <= 17) el = elements.find(x => x.period === 8 && x.group === c);
            else if (r === 10 && c >= 3 && c <= 17) el = elements.find(x => x.period === 9 && x.group === c);
            
            if (el) {
                html += `
                <div class="element-cell ${el.c}" data-id="${el.n}" style="grid-column:${c};grid-row:${r}" tabindex="0">
                    <span class="e-num">${el.n}</span>
                    <span class="e-symbol">${el.s}</span>
                    <span class="e-name">${el.name}</span>
                </div>`;
            }
        }
    }
    grid.innerHTML = html;

    // Attach events
    $$('.element-cell').forEach(cell => {
        cell.addEventListener('click', () => showDetails(parseInt(cell.dataset.id)));
    });
}

function renderLegend() {
    const parent = $('#legendFilter');
    let html = '';
    for (const k in CATEGORIES) {
        html += `
        <div class="legend-item" data-cat="${k}">
            <div class="legend-color" style="background:${CATEGORIES[k].color}"></div>
            <span>${CATEGORIES[k].name}</span>
        </div>`;
    }
    parent.innerHTML = html;

    $$('.legend-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const cat = item.dataset.cat;
            $$('.element-cell').forEach(c => {
                c.classList.toggle('filtered', !c.classList.contains(cat));
            });
        });
        item.addEventListener('mouseleave', () => {
            $$('.element-cell').forEach(c => c.classList.remove('filtered'));
        });
    });
}

const panel = $('#elementPanel');
const content = $('#panelContent');

function showDetails(id) {
    const el = elements.find(x => x.n === id);
    if (!el) return;

    const catName = CATEGORIES[el.c] ? CATEGORIES[el.c].name : 'Unknown';
    const color = CATEGORIES[el.c] ? CATEGORIES[el.c].color : 'var(--border)';

    let html = `
    <div class="detail-header">
        <div class="detail-block" style="border-color:${color}">
            <span class="detail-num" style="color:var(--text-muted)">${el.n}</span>
            <span class="detail-sym" style="color:${color}">${el.s}</span>
        </div>
        <div class="detail-info">
            <h2>${el.name}</h2>
            <span class="cat-badge" style="border-color:${color};color:${color}">${catName}</span>
        </div>
    </div>
    <div class="data-grid">
        <div class="data-item"><div class="data-lbl">Atomic Mass</div><div class="data-val">${el.mass} u</div></div>
        <div class="data-item"><div class="data-lbl">Electron Config</div><div class="data-val">${el.ec}</div></div>
        <div class="data-item"><div class="data-lbl">Group</div><div class="data-val">${el.group || 'N/A'}</div></div>
        <div class="data-item"><div class="data-lbl">Period</div><div class="data-val">${el.period > 7 ? el.period-2 : el.period}</div></div>
        <div class="desc-box">
            ${escapeHtml(el.desc)}
            <h4 style="margin-top:20px;text-align:center;color:var(--accent);">Live Bohr Model</h4>
            <div style="text-align:center;"><canvas id="bohrCanvas" width="250" height="250" style="margin:10px auto;border-radius:50%;background:rgba(0,0,0,0.2);box-shadow:inset 0 0 20px rgba(0,0,0,0.5);"></canvas></div>
        </div>
    </div>
    `;
    content.innerHTML = html;
    panel.classList.add('open');
    drawBohrModel(el);
}

// Draw dynamic Bohr Model
function drawBohrModel(el) {
    const cvs = document.getElementById('bohrCanvas');
    if(!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height;
    const cx = w/2, cy = h/2;
    
    // Calculate electrons per shell based on atomic number
    let z = el.n;
    const maxCapacity = [2, 8, 18, 32, 32, 18, 8];
    const shells = [];
    for(let cap of maxCapacity) {
        if(z <= 0) break;
        let e = Math.min(z, cap);
        // Correcting valence anomalies for simplicity (Bohr is an approximation)
        if(z > cap && e === cap && cap >= 18 && z - cap < 8) {
            e = cap - Math.min(z-cap+8, 10); // rough fallback
        }
        shells.push(e);
        z -= e;
    }
    
    // Animate
    let t = 0;
    function render() {
        if(!cvs.isConnected) return;
        ctx.clearRect(0,0,w,h);
        
        // Nucleus
        ctx.beginPath();
        const nGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 15);
        nGrad.addColorStop(0, '#fff');
        nGrad.addColorStop(1, 'var(--accent)');
        ctx.fillStyle = nGrad;
        ctx.arc(cx, cy, 15, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(el.s, cx, cy+4);
        
        // Shells
        const shellDist = (w/2 - 20) / shells.length;
        shells.forEach((electrons, sIdx) => {
            const r = 25 + sIdx * shellDist;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1.5;
            ctx.arc(cx, cy, r, 0, Math.PI*2);
            ctx.stroke();
            
            // Electrons
            for(let e=0; e<electrons; e++) {
                const angle = (Math.PI*2 / electrons) * e + (t * (sIdx % 2===0 ? 1 : -1) * (0.02 - sIdx*0.003));
                const ex = cx + Math.cos(angle) * r;
                const ey = cy + Math.sin(angle) * r;
                ctx.beginPath();
                ctx.fillStyle = '#6366f1';
                ctx.arc(ex, ey, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 5; ctx.shadowColor = '#6366f1'; ctx.fill(); ctx.shadowBlur = 0;
            }
        });
        t += 0.5;
        requestAnimationFrame(render);
    }
    render();
}


$('#closePanelBtn').addEventListener('click', () => panel.classList.remove('open'));

$('#searchInput').addEventListener('input', applyFilters);

// Temperature controls are now natively handled in HTML and listeners below
let sensitivityMode = false;
let currentTemp = 298;

$('#tempInput').addEventListener('input', (e) => {
    currentTemp = parseInt(e.target.value);
    $('#tempVal').textContent = currentTemp + ' K';
    applyFilters();
});

$('#sensitivityBtn').addEventListener('click', () => {
    sensitivityMode = !sensitivityMode;
    $('#sensitivityBtn').classList.toggle('btn-primary', sensitivityMode);
    $('#sensitivityBtn').classList.toggle('btn-secondary', !sensitivityMode);
    applyFilters();
});

function getPhase(n, temp) {
    // Highly simplified melting/boiling model for demonstration
    // Noble gases (gas at room temp, liquify very low)
    const noble = [2, 10, 18, 36, 54, 86];
    if(noble.includes(n)) return temp < 100 ? (temp < 10 ? 'solid' : 'liquid') : 'gas';
    
    // Halogens / Nonmetals
    const nonMetals = [1, 7, 8, 9, 17, 35, 53];
    if(nonMetals.includes(n)) return temp < 200 ? 'solid' : (temp < 300 && n===35 ? 'liquid' : 'gas');

    // Liquids at room temp
    if(n === 80) return temp < 234 ? 'solid' : (temp > 630 ? 'gas' : 'liquid'); // Mercury
    
    // High melt solids
    const meltingPt = 600 + (n * 10);
    const boilingPt = meltingPt + 1500;
    if(temp > boilingPt) return 'gas';
    if(temp > meltingPt) return 'liquid';
    return 'solid';
}

function applyFilters() {
    const term = $('#searchInput').value.toLowerCase();
    
    $$('.element-cell').forEach(cell => {
        const id = parseInt(cell.dataset.id);
        const el = elements.find(x => x.n === id);
        
        // Search Matching
        let match = true;
        if (term) {
            match = el.name.toLowerCase().includes(term) || el.s.toLowerCase().includes(term) || el.n.toString() === term;
        }

        // Sensitivity Matching
        let isSensitive = false;
        if (sensitivityMode) {
            // Highly reactive (alkali) or Radioactive (n > 82 or 43, 61)
            isSensitive = (id > 82 || id === 43 || id === 61 || el.group === 1 || el.group === 17);
            if (!isSensitive) match = false;
        }
        
        // Temperature phase
        const phase = getPhase(id, currentTemp);
        
        if (!match) {
            cell.style.opacity = sensitivityMode ? '0.2' : '0.1';
            cell.style.transform = 'scale(0.9)';
            cell.style.filter = 'grayscale(100%)';
            cell.style.boxShadow = 'none';
        } else {
            cell.style.opacity = '1';
            cell.style.transform = 'scale(1)';
            
            // Apply Physical State Visuals via CSS classes
            cell.classList.remove('phase-solid', 'phase-liquid', 'phase-gas');
            cell.classList.add('phase-' + phase);
            
            if (sensitivityMode) {
                cell.style.filter = 'drop-shadow(0 0 10px var(--c-alkali))';
            } else {
                cell.style.filter = 'none';
            }
        }
    });
}


$('#themeBtn').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', html.dataset.theme);
});

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    $('#themeBtn').textContent = '☀️';
}

function escapeHtml(s) { return s.replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

renderGrid();
renderLegend();

// ── Quiz Mode ──
let quizMode = false;
let currentQuizElement = null;

$('#quizModeBtn').addEventListener('click', () => {
    quizMode = !quizMode;
    if (quizMode) {
        $('#quizModeBtn').classList.replace('btn-secondary', 'btn-primary');
        $('#quizModeBtn').textContent = '🛑 End Quiz';
        startQuiz();
    } else {
        $('#quizModeBtn').classList.replace('btn-primary', 'btn-secondary');
        $('#quizModeBtn').textContent = '🎓 Quiz Mode';
        endQuiz();
    }
});

function startQuiz() {
    $$('.element-cell').forEach(c => {
        c.classList.add('quiz-hidden');
        c.querySelector('.e-symbol').style.visibility = 'hidden';
        c.querySelector('.e-name').style.visibility = 'hidden';
        c.querySelector('.e-num').style.visibility = 'hidden';
    });
    pickQuizElement();
}

function endQuiz() {
    $$('.element-cell').forEach(c => {
        c.classList.remove('quiz-hidden');
        c.querySelector('.e-symbol').style.visibility = 'visible';
        c.querySelector('.e-name').style.visibility = 'visible';
        c.querySelector('.e-num').style.visibility = 'visible';
        c.style.background = '';
    });
    const quizPanel = $('#quizPanel');
    if(quizPanel) quizPanel.remove();
}

function pickQuizElement() {
    currentQuizElement = elements[Math.floor(Math.random() * elements.length)];
    let quizPanel = $('#quizPanel');
    if (!quizPanel) {
        quizPanel = document.createElement('div');
        quizPanel.id = 'quizPanel';
        quizPanel.className = 'glass-card';
        quizPanel.style.position = 'fixed';
        quizPanel.style.bottom = '20px';
        quizPanel.style.left = '50%';
        quizPanel.style.transform = 'translateX(-50%)';
        quizPanel.style.zIndex = '1000';
        quizPanel.style.padding = '1rem 2rem';
        quizPanel.style.textAlign = 'center';
        document.body.appendChild(quizPanel);
    }
    quizPanel.innerHTML = `<h3>Find the Element:</h3><h2 style="font-size:2rem;color:var(--accent);margin-top:0.5rem">${currentQuizElement.name}</h2><p class="text-muted" style="font-size:0.8rem">Click on the correct position in the table</p>`;
}

// Intercept click on element cell
const originalRenderGrid = renderGrid;
// Actually we already have attach events in renderGrid, we can just intercept showDetails
const originalShowDetails = showDetails;

showDetails = function(id) {
    if (quizMode) {
        const el = elements.find(x => x.n === id);
        const cell = document.querySelector(`.element-cell[data-id="${id}"]`);
        if (id === currentQuizElement.n) {
            cell.style.background = 'var(--c-alkaline)'; // Greenish success
            setTimeout(() => {
                cell.querySelector('.e-symbol').style.visibility = 'visible';
                cell.querySelector('.e-num').style.visibility = 'visible';
                pickQuizElement();
            }, 600);
        } else {
            cell.style.background = 'var(--c-actinide)'; // Reddish error
            setTimeout(() => {
                cell.style.background = '';
            }, 500);
        }
    } else {
        originalShowDetails(id);
    }
};

    // ═══════════════════════════════════════════════════
    // ENHANCED TEMPERATURE LOGIC (Fixed: targets .element-cell)
    // ═══════════════════════════════════════════════════
    
    // Real melting/boiling points in Kelvin for all 118 elements
    const PHASE_DATA = {
        1:{m:14,b:20},2:{m:1,b:4},3:{m:454,b:1603},4:{m:1560,b:2742},5:{m:2349,b:4200},
        6:{m:3823,b:4098},7:{m:63,b:77},8:{m:54,b:90},9:{m:53,b:85},10:{m:25,b:27},
        11:{m:371,b:1156},12:{m:923,b:1363},13:{m:933,b:2792},14:{m:1687,b:3538},
        15:{m:317,b:554},16:{m:388,b:718},17:{m:172,b:239},18:{m:84,b:87},
        19:{m:337,b:1032},20:{m:1115,b:1757},21:{m:1814,b:3109},22:{m:1941,b:3560},
        23:{m:2183,b:3680},24:{m:2180,b:2944},25:{m:1519,b:2334},26:{m:1811,b:3134},
        27:{m:1768,b:3200},28:{m:1728,b:3186},29:{m:1358,b:2835},30:{m:693,b:1180},
        31:{m:303,b:2477},32:{m:1211,b:3106},33:{m:1090,b:887},34:{m:494,b:958},
        35:{m:266,b:332},36:{m:116,b:120},37:{m:312,b:961},38:{m:1050,b:1655},
        39:{m:1799,b:3609},40:{m:2128,b:4682},41:{m:2750,b:5017},42:{m:2896,b:4912},
        43:{m:2430,b:4538},44:{m:2607,b:4423},45:{m:2237,b:3968},46:{m:1828,b:3236},
        47:{m:1235,b:2435},48:{m:594,b:1040},49:{m:430,b:2345},50:{m:505,b:2875},
        51:{m:904,b:1860},52:{m:723,b:1261},53:{m:387,b:457},54:{m:161,b:165},
        55:{m:302,b:944},56:{m:1000,b:2170},57:{m:1193,b:3737},58:{m:1068,b:3716},
        59:{m:1208,b:3793},60:{m:1297,b:3347},61:{m:1315,b:3273},62:{m:1345,b:2067},
        63:{m:1099,b:1802},64:{m:1585,b:3546},65:{m:1629,b:3503},66:{m:1680,b:2840},
        67:{m:1734,b:2993},68:{m:1802,b:3141},69:{m:1818,b:2223},70:{m:1097,b:1469},
        71:{m:1925,b:3675},72:{m:2506,b:4876},73:{m:3290,b:5731},74:{m:3695,b:5828},
        75:{m:3459,b:5869},76:{m:3306,b:5285},77:{m:2719,b:4701},78:{m:2041,b:4098},
        79:{m:1337,b:3129},80:{m:234,b:630},81:{m:577,b:1746},82:{m:601,b:2022},
        83:{m:544,b:1837},84:{m:527,b:1235},85:{m:575,b:610},86:{m:202,b:211},
        87:{m:300,b:950},88:{m:973,b:2010},89:{m:1323,b:3471},90:{m:2115,b:5061},
        91:{m:1841,b:4300},92:{m:1405,b:4404},93:{m:917,b:4175},94:{m:913,b:3501},
        95:{m:1449,b:2880},96:{m:1613,b:3383},97:{m:1259,b:2900},98:{m:1173,b:1743},
        99:{m:1133,b:1269},100:{m:1800,b:1800},101:{m:1100,b:1100},102:{m:1100,b:1100},
        103:{m:1900,b:1900},104:{m:2400,b:5800},105:{m:2400,b:5800},106:{m:2400,b:5800},
        107:{m:2400,b:5800},108:{m:2400,b:5800},109:{m:2400,b:5800},110:{m:2400,b:5800},
        111:{m:2400,b:5800},112:{m:340,b:357},113:{m:700,b:1400},114:{m:340,b:420},
        115:{m:700,b:1400},116:{m:709,b:883},117:{m:623,b:883},118:{m:325,b:450}
    };

    function getStateAtTemp(el, currentTemp) {
        if (!el) return 'solid';
        const temp = parseFloat(currentTemp);
        const pd = PHASE_DATA[el.n];
        if (pd) {
            if (temp >= pd.b) return 'gas';
            if (temp >= pd.m) return 'liquid';
            return 'solid';
        }
        // Fallback based on category
        let melt = 1000, boil = 3000;
        if (el.c === 'noble_gas') { melt = 10; boil = 100; }
        else if (el.c === 'nonmetal' || el.c === 'halogen') { melt = 200; boil = 350; }
        else if (el.c === 'alkali_metal') { melt = 350; boil = 1000; }
        else if (el.c === 'alkaline_earth') { melt = 900; boil = 1800; }
        if (temp >= boil) return 'gas';
        if (temp >= melt) return 'liquid';
        return 'solid';
    }

    // Hook into the actual HTML temperature slider (#tempInput)
    const tempInput = document.getElementById('tempInput');
    const tempVal = document.getElementById('tempVal');
    
    if (tempInput) {
        tempInput.addEventListener('input', (e) => {
            const temp = parseInt(e.target.value);
            if (tempVal) tempVal.textContent = temp + ' K';
            
            // FIXED: Target .element-cell (actual DOM class), not .element-card
            document.querySelectorAll('.element-cell').forEach(cell => {
                const id = cell.dataset.id;
                const elData = elements.find(x => x.n === parseInt(id));
                if (!elData) return;
                
                const state = getStateAtTemp(elData, temp);
                // Add phase state indicator
                cell.dataset.phase = state;
                
                if (state === 'liquid') {
                    cell.style.opacity = '0.85';
                    cell.style.boxShadow = '0 0 12px rgba(0, 150, 255, 0.6)';
                    cell.style.transform = 'scale(0.97)';
                    cell.style.borderColor = 'rgba(0, 150, 255, 0.5)';
                } else if (state === 'gas') {
                    cell.style.opacity = '0.35';
                    cell.style.boxShadow = 'none';
                    cell.style.transform = 'scale(0.93)';
                    cell.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                } else {
                    cell.style.opacity = '1';
                    cell.style.boxShadow = '';
                    cell.style.transform = 'scale(1)';
                    cell.style.borderColor = '';
                }
            });
            
            // Update phase legend counts
            updatePhaseLegend(temp);
        });
    }

    function updatePhaseLegend(temp) {
        let solid = 0, liquid = 0, gas = 0;
        elements.forEach(el => {
            const state = getStateAtTemp(el, temp);
            if (state === 'solid') solid++;
            else if (state === 'liquid') liquid++;
            else gas++;
        });
        const legend = document.getElementById('phaseLegend');
        if (legend) {
            legend.innerHTML = `
                <span style="color:#60a5fa;">● Solid: ${solid}</span>
                <span style="color:#06b6d4;">● Liquid: ${liquid}</span>
                <span style="color:rgba(255,255,255,0.4);">● Gas: ${gas}</span>
            `;
        }
    }

    // ═══════════════════════════════════════════════════
    // ELEMENT COMBINING LAB
    // ═══════════════════════════════════════════════════
    const REACTIONS_DB = [
        { reactants: [1,8], product: 'H₂O', name: 'Water', ratio: '2H₂ + O₂', conditions: 'Spark/flame', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [1,17], product: 'HCl', name: 'Hydrochloric acid', ratio: 'H₂ + Cl₂', conditions: 'UV light or heat', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [11,17], product: 'NaCl', name: 'Table salt', ratio: '2Na + Cl₂', conditions: 'Room temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [6,8], product: 'CO₂', name: 'Carbon dioxide', ratio: 'C + O₂', conditions: 'Combustion (heat)', type: 'Combustion', bond: 'Covalent' },
        { reactants: [26,8], product: 'Fe₂O₃', name: 'Iron(III) oxide (Rust)', ratio: '4Fe + 3O₂', conditions: 'Moisture + O₂', type: 'Oxidation', bond: 'Ionic' },
        { reactants: [12,8], product: 'MgO', name: 'Magnesium oxide', ratio: '2Mg + O₂', conditions: 'Burning (bright flame)', type: 'Combustion', bond: 'Ionic' },
        { reactants: [13,8], product: 'Al₂O₃', name: 'Aluminum oxide', ratio: '4Al + 3O₂', conditions: 'High temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [7,1], product: 'NH₃', name: 'Ammonia', ratio: 'N₂ + 3H₂', conditions: 'Haber process (450°C, catalyst)', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [16,8], product: 'SO₂', name: 'Sulfur dioxide', ratio: 'S + O₂', conditions: 'Combustion', type: 'Combustion', bond: 'Covalent' },
        { reactants: [20,6], product: 'CaCO₃', name: 'Calcium carbonate (Limestone)', ratio: 'Ca + C + 3O', conditions: 'Natural formation', type: 'Synthesis', bond: 'Ionic/Covalent' },
        { reactants: [19,35], product: 'KBr', name: 'Potassium bromide', ratio: '2K + Br₂', conditions: 'Room temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [14,8], product: 'SiO₂', name: 'Silicon dioxide (Quartz)', ratio: 'Si + O₂', conditions: 'High temperature', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [29,16], product: 'CuS', name: 'Copper sulfide', ratio: 'Cu + S', conditions: 'Heat', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [30,8], product: 'ZnO', name: 'Zinc oxide', ratio: '2Zn + O₂', conditions: 'Burning', type: 'Combustion', bond: 'Ionic' },
        { reactants: [15,8], product: 'P₂O₅', name: 'Phosphorus pentoxide', ratio: '4P + 5O₂', conditions: 'Burning in air', type: 'Combustion', bond: 'Covalent' },
        { reactants: [11,8], product: 'Na₂O', name: 'Sodium oxide', ratio: '4Na + O₂', conditions: 'Heating', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [3,7], product: 'Li₃N', name: 'Lithium nitride', ratio: '6Li + N₂', conditions: 'Room temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [20,17], product: 'CaCl₂', name: 'Calcium chloride', ratio: 'Ca + Cl₂', conditions: 'Direct combination', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [1,16], product: 'H₂S', name: 'Hydrogen sulfide', ratio: 'H₂ + S', conditions: 'Heat', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [6,1], product: 'CH₄', name: 'Methane', ratio: 'C + 2H₂', conditions: 'High pressure/temp', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [47,16], product: 'Ag₂S', name: 'Silver sulfide (Tarnish)', ratio: '2Ag + S', conditions: 'Air exposure', type: 'Oxidation', bond: 'Ionic' },
        { reactants: [22,17], product: 'TiCl₄', name: 'Titanium tetrachloride', ratio: 'Ti + 2Cl₂', conditions: 'High temperature', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [50,8], product: 'SnO₂', name: 'Tin dioxide', ratio: 'Sn + O₂', conditions: 'Heating in air', type: 'Combustion', bond: 'Ionic' },
        { reactants: [82,16], product: 'PbS', name: 'Lead sulfide (Galena)', ratio: 'Pb + S', conditions: 'Heat', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [19,8], product: 'K₂O', name: 'Potassium oxide', ratio: '4K + O₂', conditions: 'Burning', type: 'Combustion', bond: 'Ionic' },
        { reactants: [56,8], product: 'BaO', name: 'Barium oxide', ratio: '2Ba + O₂', conditions: 'Heating', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [25,8], product: 'MnO₂', name: 'Manganese dioxide', ratio: 'Mn + O₂', conditions: 'Natural oxidation', type: 'Oxidation', bond: 'Ionic' },
        { reactants: [24,8], product: 'Cr₂O₃', name: 'Chromium(III) oxide', ratio: '4Cr + 3O₂', conditions: 'High temperature', type: 'Synthesis', bond: 'Ionic' },
        { reactants: [74,6], product: 'WC', name: 'Tungsten carbide', ratio: 'W + C', conditions: '1400-1600°C', type: 'Synthesis', bond: 'Covalent' },
        { reactants: [28,8], product: 'NiO', name: 'Nickel oxide', ratio: '2Ni + O₂', conditions: 'Heating in air', type: 'Synthesis', bond: 'Ionic' }
    ];
    
    window.findReactions = function(el1Num, el2Num) {
        return REACTIONS_DB.filter(r => 
            (r.reactants.includes(el1Num) && r.reactants.includes(el2Num))
        );
    };

    // Combine elements UI — triggered from a "Combine" button
    window.openCombineLab = function() {
        let panel = document.getElementById('combineLab');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'combineLab';
            panel.className = 'glass-card';
            panel.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:1000; padding:1.5rem; max-width:600px; width:90%; max-height:80vh; overflow-y:auto; background:rgba(10,15,30,0.95); border:1px solid var(--accent); border-radius:16px;';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0; color:var(--accent);">⚗️ Element Combining Lab</h3>
                <button onclick="document.getElementById('combineLab').remove()" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; gap:1rem; margin-bottom:1rem; flex-wrap:wrap;">
                <select id="combineEl1" style="flex:1; min-width:120px; padding:0.5rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
                    ${elements.map(e => `<option value="${e.n}">${e.n}. ${e.name} (${e.s})</option>`).join('')}
                </select>
                <span style="color:var(--accent); font-size:1.5rem; align-self:center;">+</span>
                <select id="combineEl2" style="flex:1; min-width:120px; padding:0.5rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
                    ${elements.map(e => `<option value="${e.n}" ${e.n===8?'selected':''}>${e.n}. ${e.name} (${e.s})</option>`).join('')}
                </select>
                <button onclick="performCombine()" class="btn btn-primary" style="padding:0.5rem 1.2rem;">Combine</button>
            </div>
            <div id="combineResults" style="min-height:80px;"></div>
        `;
    };
    
    window.performCombine = function() {
        const el1 = parseInt(document.getElementById('combineEl1').value);
        const el2 = parseInt(document.getElementById('combineEl2').value);
        const results = findReactions(el1, el2);
        const container = document.getElementById('combineResults');
        
        const el1Data = elements.find(x => x.n === el1);
        const el2Data = elements.find(x => x.n === el2);
        
        if (results.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🔬</div>
                No known common reaction between <strong>${el1Data?.name || el1}</strong> and <strong>${el2Data?.name || el2}</strong>.<br>
                <span style="font-size:0.8rem;">Try combining metals with non-metals, or check elements like H, O, C, Na, Cl.</span>
            </div>`;
            return;
        }
        
        container.innerHTML = results.map(r => `
            <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:10px; padding:1rem; margin-bottom:0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <h4 style="margin:0; color:#4ade80; font-size:1.1rem;">${r.product} — ${r.name}</h4>
                    <span style="font-size:0.75rem; padding:2px 8px; border-radius:12px; background:rgba(99,102,241,0.15); color:var(--accent);">${r.type}</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.85rem;">
                    <div><strong style="color:var(--text-muted);">Equation:</strong> ${r.ratio} → ${r.product}</div>
                    <div><strong style="color:var(--text-muted);">Bond Type:</strong> ${r.bond}</div>
                    <div style="grid-column:1/-1;"><strong style="color:var(--text-muted);">Conditions:</strong> ${r.conditions}</div>
                </div>
            </div>
        `).join('');
    };

    // ═══════════════════════════════════════════════════
    // COMPARISON MODE
    // ═══════════════════════════════════════════════════
    window.openCompareMode = function() {
        let panel = document.getElementById('comparePanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'comparePanel';
            panel.className = 'glass-card';
            panel.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:1000; padding:1.5rem; max-width:700px; width:90%; max-height:80vh; overflow-y:auto; background:rgba(10,15,30,0.95); border:1px solid var(--accent); border-radius:16px;';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0; color:var(--accent);">⚖️ Element Comparison</h3>
                <button onclick="document.getElementById('comparePanel').remove()" style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; gap:1rem; margin-bottom:1rem;">
                <select id="cmpEl1" onchange="doCompare()" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
                    ${elements.map(e => `<option value="${e.n}">${e.n}. ${e.name}</option>`).join('')}
                </select>
                <span style="color:var(--text-muted); align-self:center;">vs</span>
                <select id="cmpEl2" onchange="doCompare()" style="flex:1; padding:0.5rem; background:rgba(0,0,0,0.3); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:8px;">
                    ${elements.map(e => `<option value="${e.n}" ${e.n===79?'selected':''}>${e.n}. ${e.name}</option>`).join('')}
                </select>
            </div>
            <div id="cmpResults"></div>
        `;
        doCompare();
    };

    window.doCompare = function() {
        const n1 = parseInt(document.getElementById('cmpEl1').value);
        const n2 = parseInt(document.getElementById('cmpEl2').value);
        const e1 = elements.find(x => x.n === n1);
        const e2 = elements.find(x => x.n === n2);
        if (!e1 || !e2) return;
        
        const pd1 = PHASE_DATA[n1] || {m:'?',b:'?'};
        const pd2 = PHASE_DATA[n2] || {m:'?',b:'?'};
        
        const props = [
            ['Symbol', e1.s, e2.s],
            ['Atomic Number', e1.n, e2.n],
            ['Category', e1.c?.replace(/_/g,' '), e2.c?.replace(/_/g,' ')],
            ['Period', e1.period || '?', e2.period || '?'],
            ['Group', e1.group || '?', e2.group || '?'],
            ['Melting Point', pd1.m+'K', pd2.m+'K'],
            ['Boiling Point', pd1.b+'K', pd2.b+'K'],
            ['Electronegativity', e1.electronegativity || '?', e2.electronegativity || '?'],
            ['Density', e1.density || '?', e2.density || '?']
        ];
        
        document.getElementById('cmpResults').innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead><tr style="border-bottom:2px solid rgba(99,102,241,0.3);">
                    <th style="text-align:left; padding:6px; color:var(--text-muted);">Property</th>
                    <th style="text-align:center; padding:6px; color:#4ade80;">${e1.name}</th>
                    <th style="text-align:center; padding:6px; color:#60a5fa;">${e2.name}</th>
                </tr></thead>
                <tbody>${props.map(([prop,v1,v2]) => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                        <td style="padding:6px; color:var(--text-muted);">${prop}</td>
                        <td style="padding:6px; text-align:center; font-weight:600;">${v1}</td>
                        <td style="padding:6px; text-align:center; font-weight:600;">${v2}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
    };

    // Inject Combine & Compare buttons
    const modeToggles = document.querySelector('.mode-toggles');
    if (modeToggles) {
        const combineBtn = document.createElement('button');
        combineBtn.className = 'btn btn-secondary btn-sm';
        combineBtn.textContent = '⚗️ Combine Elements';
        combineBtn.onclick = openCombineLab;
        modeToggles.appendChild(combineBtn);
        
        const compareBtn = document.createElement('button');
        compareBtn.className = 'btn btn-secondary btn-sm';
        compareBtn.textContent = '⚖️ Compare';
        compareBtn.onclick = openCompareMode;
        modeToggles.appendChild(compareBtn);
    }

    // Add phase legend element
    const phaseControls = document.querySelector('.phase-controls');
    if (phaseControls) {
        const legend = document.createElement('div');
        legend.id = 'phaseLegend';
        legend.style.cssText = 'display:flex; gap:1rem; font-size:0.8rem; margin-top:0.5rem; justify-content:center;';
        phaseControls.appendChild(legend);
        updatePhaseLegend(298);
    }

})();

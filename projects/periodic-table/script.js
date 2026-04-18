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

    // -- ENHANCED TEMPERATURE LOGIC --
    const tempInput = document.getElementById('tempInput');
    const tempVal = document.getElementById('tempVal');
    
    // Fallback pseudo-melting/boiling thresholds if missing\n\n
    function getStateAtTemp(el, currentTemp) {
        if (!el) return 'solid';
        // Simplified Phase logic based on melting/boiling points
        const temp = parseFloat(currentTemp);
        let melt = 300; let boil = 1000;
        if (el.c === 'noble_gas') { melt = 10; boil = 50; }
        if (el.c === 'halogen') { melt = 200; boil = 300; }
        if (el.c === 'nonmetal') { melt = 250; boil = 400; }
        if (temp > boil) return 'gas';
        if (temp > melt) return 'liquid';
        return 'solid';
    }

    const slider = document.getElementById('tempSlider');
    const valDisplay = document.getElementById('tempValueDisplay');
    if (slider && valDisplay) {
        slider.addEventListener('input', (e) => {
            const temp = e.target.value;
            valDisplay.textContent = temp + ' K';
            document.querySelectorAll('.element-card').forEach(card => {
                const num = parseInt(card.dataset.n);
                const elData = elements.find(x => x.n === num);
                if (elData) {
                    const state = getStateAtTemp(elData, temp);
                    if (state === 'liquid') {
                        card.style.opacity = '0.8';
                        card.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.5)';
                        card.style.transform = 'scale(0.98)';
                    } else if (state === 'gas') {
                        card.style.opacity = '0.2';
                        card.style.boxShadow = 'none';
                        card.style.transform = 'scale(0.95)';
                    } else {
                        card.style.opacity = '1';
                        card.style.boxShadow = 'var(--shadow-sm)';
                        card.style.transform = 'scale(1)';
                    }
                }
            });
        });
    }

})();

    // -- ENHANCED TEMPERATURE LOGIC --
    const tempInput = document.getElementById('tempInput');
    const tempVal = document.getElementById('tempVal');
    
    // Fallback pseudo-melting/boiling thresholds if missing
    function getStateAtTemp(el, currentTemp) {
        // Mock calculations based on group/type to simulate state changes visually
        let melt = 1000, boil = 3000;
        if (el.c === 'noble_gas') { melt = 10; boil = 100; }
        else if (el.c === 'nonmetal' || el.c === 'halogen') { melt = 200; boil = 350; }
        else if (el.group === 1) { melt = 350; boil = 1000; }
        else if (el.group === 2) { melt = 900; boil = 1800; }
        
        if (currentTemp < melt) return 'solid';
        if (currentTemp < boil) return 'liquid';
        return 'gas';
    }

    if (tempInput) {
        tempInput.addEventListener('input', (e) => {
            const temp = parseInt(e.target.value);
            tempVal.textContent = temp + ' K';
            
            document.querySelectorAll('.element-card').forEach(card => {
                const num = parseInt(card.dataset.n);
                const elData = elements.find(x => x.n === num);
                if (elData) {
                    const state = getStateAtTemp(elData, temp);
                    if (state === 'liquid') {
                        card.style.opacity = '0.8';
                        card.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.5)';
                        card.style.transform = 'scale(0.98)';
                    } else if (state === 'gas') {
                        card.style.opacity = '0.3';
                        card.style.boxShadow = 'none';
                        card.style.transform = 'scale(0.95)';
                    } else {
                        card.style.opacity = '1';
                        card.style.boxShadow = 'var(--shadow-sm)';
                        card.style.transform = 'scale(1)';
                    }
                }
            });
        });
    }

    // -- ENHANCED TEMPERATURE LOGIC --
    const tempInput = document.getElementById('tempInput');
    const tempVal = document.getElementById('tempVal');
    
    // Fallback pseudo-melting/boiling thresholds if missing
    function getStateAtTemp(el, currentTemp) {
        // Mock calculations based on group/type to simulate state changes visually
        let melt = 1000, boil = 3000;
        if (el.c === 'noble_gas') { melt = 10; boil = 100; }
        else if (el.c === 'nonmetal' || el.c === 'halogen') { melt = 200; boil = 350; }
        else if (el.group === 1) { melt = 350; boil = 1000; }
        else if (el.group === 2) { melt = 900; boil = 1800; }
        
        if (currentTemp < melt) return 'solid';
        if (currentTemp < boil) return 'liquid';
        return 'gas';
    }

    if (tempInput) {
        tempInput.addEventListener('input', (e) => {
            const temp = parseInt(e.target.value);
            tempVal.textContent = temp + ' K';
            
            document.querySelectorAll('.element-card').forEach(card => {
                const num = parseInt(card.dataset.n);
                const elData = elements.find(x => x.n === num);
                if (elData) {
                    const state = getStateAtTemp(elData, temp);
                    if (state === 'liquid') {
                        card.style.opacity = '0.8';
                        card.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.5)';
                        card.style.transform = 'scale(0.98)';
                    } else if (state === 'gas') {
                        card.style.opacity = '0.3';
                        card.style.boxShadow = 'none';
                        card.style.transform = 'scale(0.95)';
                    } else {
                        card.style.opacity = '1';
                        card.style.boxShadow = 'var(--shadow-sm)';
                        card.style.transform = 'scale(1)';
                    }
                }
            });
        });
    }

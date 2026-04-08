window.RealisticDrawings = (function(){
    // Helper to add intricate coloring patterns for standard/complex difficulties to break up large spaces.
    function generateScalePattern(pathStr, type) {
        let diff = window.ColoringHelpers ? window.ColoringHelpers.getDiff() : 'standard';
        if (diff === 'simple') return pathStr;
        
        let s = pathStr;
        const count = diff === 'standard' ? 5 : 15;
        
        // Add randomish intersecting curves to break up the shape and provide coloring zones!
        if (type === 'dinosaur' || type === 'animal') {
            for(let i=0; i<count; i++) {
                const y = 50 + i * (400/count);
                s += window.ColoringHelpers.path(`M0,${y} Q125,${y-30} 250,${y} T500,${y}`); 
                const x = 50 + i * (400/count);
                s += window.ColoringHelpers.path(`M${x},0 Q${x-30},125 ${x},250 T${x},500`); 
            }
        }
        if (type === 'vehicle') {
            for(let i=0; i<count; i++) {
                const step = 50 + i * (400/count);
                s += window.ColoringHelpers.path(`M${step},0 L${step},500`);
                s += window.ColoringHelpers.path(`M0,${step} L500,${step}`);
            }
        }
        return s;
    }

    return {
        genAnimal: function(idx) {
            let p = "";
            let diff = window.ColoringHelpers ? window.ColoringHelpers.getDiff() : 'standard';
            if (idx % 20 === 3) {
                // Detailed Elephant
                p += window.ColoringHelpers.path(`M150,230 C100,200 130,250 150,270 C150,370 200,400 230,350 C240,350 260,350 270,350 C280,400 330,370 330,270 C370,260 400,240 370,200 C330,150 250,130 150,230 Z`);
                // Ear
                p += window.ColoringHelpers.path(`M210,200 C230,150 290,170 290,230 C290,290 230,310 210,200 Z`);
                // Trunk
                p += window.ColoringHelpers.path(`M150,230 C100,300 130,400 100,430 C80,380 110,270 150,250 Z`);
                p += window.ColoringHelpers.circle(170, 210, 5);
            } else if (idx % 20 === 1) { // Dog
                p += window.ColoringHelpers.path(`M200,250 C150,250 150,300 200,350 C250,350 250,300 300,350 C350,350 350,250 300,250 Z`);
                p += window.ColoringHelpers.path(`M150,200 C100,100 250,100 200,200 Z`);
                p += window.ColoringHelpers.circle(175, 175, 5); p += window.ColoringHelpers.circle(225, 175, 5);
            } else {
                // Generic detailed animal blob for now
                p += window.ColoringHelpers.path(`M150,150 C200,50 300,50 350,150 C450,200 450,300 350,350 C300,450 200,450 150,350 C50,300 50,200 150,150 Z`);
            }
            return generateScalePattern(p, 'animal');
        },
        genVehicle: function(idx) {
            let p = "";
            if (idx % 15 === 6) { // Bus
                p += window.ColoringHelpers.path(`M50,150 L450,150 Q480,150 480,200 L480,320 Q480,350 450,350 L50,350 Q20,350 20,320 L20,200 Q20,150 50,150 Z`);
                p += window.ColoringHelpers.circle(120, 350, 40) + window.ColoringHelpers.circle(120, 350, 20);
                p += window.ColoringHelpers.circle(380, 350, 40) + window.ColoringHelpers.circle(380, 350, 20);
                for(let w=0; w<5; w++){
                    p += window.ColoringHelpers.path(`M${40+w*80},170 L${100+w*80},170 L${100+w*80},250 L${40+w*80},250 Z`);
                }
            } else if (idx % 15 === 0) { // Car
                p += window.ColoringHelpers.path(`M80,250 L420,250 Q450,250 450,280 L450,320 Q450,350 420,350 L80,350 Q50,350 50,320 L50,280 Q50,250 80,250 Z`);
                p += window.ColoringHelpers.path(`M120,250 L180,180 L320,180 L380,250 Z`);
                p += window.ColoringHelpers.circle(150, 350, 30) + window.ColoringHelpers.circle(350, 350, 30);
            } else {
                p += window.ColoringHelpers.path(`M100,200 L400,200 L450,300 L50,300 Z`);
            }
            return generateScalePattern(p, 'vehicle');
        },
        genDinosaur: function(idx) {
            let p = "";
            if (idx % 10 === 0) { // T-Rex
                p += window.ColoringHelpers.path(`M250,100 C300,50 400,50 400,100 C400,150 300,150 300,200 L300,300 C300,350 200,400 150,300 C100,200 150,150 250,100 Z`);
                p += window.ColoringHelpers.path(`M300,200 L350,200 C370,200 370,220 350,220 L300,220 Z`); // Arm
                p += window.ColoringHelpers.path(`M200,350 L250,450 C270,450 270,470 250,470 L200,470 Z`); // Leg
                p += window.ColoringHelpers.path(`M250,350 L100,450 C80,450 80,430 100,430 L250,330 Z`); // Tail
            } else {
                p += window.ColoringHelpers.path(`M150,250 C200,150 300,150 350,250 C450,300 450,400 350,450 C300,550 200,550 150,450 C50,400 50,300 150,250 Z`);
            }
            return generateScalePattern(p, 'dinosaur');
        }
    };
})();

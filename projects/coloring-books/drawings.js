window.RealisticDrawings = (function() {
    return {
        genAnimal: function(idx) {
            let p = "";
            const h = window.ColoringHelpers.path;
            const aidx = idx % 3;
            // Realistic textures and intricate details for animals
            if(aidx===0) {
                // Realistic Majestic Lion
                p += h("M250,150 C220,150 200,180 200,240 C200,300 220,330 250,330 C280,330 300,300 300,240 C300,180 280,150 250,150 Z"); // Face
                for(let i=0; i<60; i++) {
                    let a = (i/60) * Math.PI*2;
                    let r1 = 120 + Math.random()*40;
                    let r2 = 160 + Math.random()*50;
                    p += h(`M${250 + r1*Math.cos(a)},${240 + r1*Math.sin(a)} Q${250 + r2*Math.cos(a+0.1)},${240 + r2*Math.sin(a+0.1)} ${250 + (r2+20)*Math.cos(a)} ,${240 + (r2+20)*Math.sin(a)}`); // intricate fur mane
                }
                p += h("M220,200 Q230,190 240,200 Q230,210 220,200 M260,200 Q270,190 280,200 Q270,210 260,200"); // Realistic eyes
                p += h("M235,260 L265,260 L250,280 Z"); // Nose
                p += h("M250,280 Q230,300 210,290 M250,280 Q270,300 290,290"); // Mouth
                // Whiskers
                for(let i=0;i<5;i++) { p += h(`M220,270 Q180,${260+i*10} 150,${270+i*15}`); p += h(`M280,270 Q320,${260+i*10} 350,${270+i*15}`); }
            } else if (aidx===1) {
                // Realistic Eagle
                p += h("M250,150 Q300,180 280,250 Q230,300 200,250 Q180,180 250,150"); // Head & Beak
                p += h("M280,200 Q320,180 340,220 Q320,240 280,220"); // Beak detail
                // Detailed feathers
                for(let x=100; x<400; x+=15) {
                    for(let y=200; y<450; y+=25) {
                        if(Math.hypot(x-250, y-300)<120) {
                            p += h(`M${x},${y} Q${x+10},${y+15} ${x},${y+30} Q${x-10},${y+15} ${x},${y}`);
                        }
                    }
                }
            } else {
                // Realistic Elephant
                p += h("M250,100 C150,100 120,200 120,300 L120,450 L180,450 L180,300 C180,200 250,150 250,150"); // Body
                for(let i=0; i<30; i++) p += h(`M${120+Math.random()*60},${150+Math.random()*250} Q${130+Math.random()*20},${160+Math.random()*250} ${140+Math.random()*40},${170+Math.random()*250}`); // Wrinkles
                p += h("M100,150 C20,100 -20,250 50,350 C80,400 120,350 120,300 Z M400,150 C480,100 520,250 450,350 C420,400 380,350 380,300 Z"); // Ears
                p += h("M250,220 Q220,400 250,480 Q280,400 250,220"); // Trunk
                for(let y=250; y<450; y+=15) p += h(`M240,${y} Q250,${y+5} 260,${y}`); // Trunk rings
            }
            return p;
        },
        genVehicle: function(idx) {
            let p = ""; const h = window.ColoringHelpers.path; const vidx = idx % 2;
            if (vidx===0) {
                // Hyper-realistic Racing Car
                p += h("M50,300 L100,260 Q150,240 200,230 L300,220 Q400,240 450,280 L480,320 L50,320 Z"); // Chassis
                p += h("M150,260 L200,200 L280,200 L350,250 Z"); // Cabin
                p += h("M250,200 L250,250 M180,250 L320,250 M320,220 Q350,240 340,250"); // Windows detailing
                // Advanced Wheels with rims
                p += h("M120,320 A40,40 0 1,1 120,321 M380,320 A40,40 0 1,1 380,321"); // Outer tire
                p += h("M120,320 A25,25 0 1,1 120,321 M380,320 A25,25 0 1,1 380,321"); // Inner rim
                for(let i=0; i<8; i++) {
                    let a = (i/8)*Math.PI*2;
                    p += h(`M${120 + 10*Math.cos(a)},${320+10*Math.sin(a)} L${120 + 25*Math.cos(a)},${320+25*Math.sin(a)}`);
                    p += h(`M${380 + 10*Math.cos(a)},${320+10*Math.sin(a)} L${380 + 25*Math.cos(a)},${320+25*Math.sin(a)}`);
                }
                // Decals
                p += h("M100,280 L200,270 L300,270 L400,290");
            } else {
                // Historic Steam Locomotive
                p += h("M100,350 L400,350 L400,200 L300,200 L300,250 L150,250 Z"); // Boiler and engine
                p += h("M320,150 L380,150 L380,200 L320,200 Z M330,120 L370,120 L380,150 L320,150 Z"); // Cabin roof
                p += h("M180,180 L220,180 L220,250 L180,250 Z"); // Smokestack
                p += h("M160,350 A30,30 0 1,1 160,351 M250,350 A30,30 0 1,1 250,351 M340,350 A30,30 0 1,1 340,351"); // Wheels
                for(let i=0; i<12; i++) {
                    let a = (i/12)*Math.PI*2;
                    p += h(`M160,350 L${160+30*Math.cos(a)},${350+30*Math.sin(a)}`);
                    p += h(`M250,350 L${250+30*Math.cos(a)},${350+30*Math.sin(a)}`);
                    p += h(`M340,350 L${340+30*Math.cos(a)},${350+30*Math.sin(a)}`);
                }
                p += h("M160,350 L340,350"); // Connecting rod
            }
            return p;
        },
        genDinosaur: function(idx) {
            let p = ""; const h = window.ColoringHelpers.path; const didx = idx % 2;
            if (didx===0) {
                // Realistic T-Rex
                p += h("M350,150 Q400,120 450,150 L450,180 Q380,220 350,200 Z"); // Jaw
                for(let i=0; i<10; i++) p += h(`M${360+i*8},170 L${365+i*8},185 L${370+i*8},170`); // Sharp teeth
                p += h("M350,200 C300,300 200,350 150,450 C100,350 50,250 100,200 C150,100 250,50 350,150 Z"); // Body and tail
                p += h("M200,300 L180,350 L190,400 M240,320 L220,380 L230,420"); // Legs
                p += h("M320,250 L340,280 L350,270"); // Tiny arms
                for(let i=0; i<40; i++) {
                    let rx = 100+Math.random()*250; let ry = 150+Math.random()*150;
                    p += h(`M${rx},${ry} A5,5 0 1,1 ${rx},${ry+0.1}`); // Scales
                }
            } else {
                // Realistic Spinosaurus
                p += h("M100,300 Q150,200 250,200 Q350,200 450,350 Q250,400 100,300 Z"); // Body
                p += h("M450,350 Q480,330 500,350 Q480,380 450,380"); // Head
                p += h("M150,210 Q250,50 350,210"); // Sail
                for(let x=160; x<350; x+=20) p += h(`M${x},200 L${x},${50+Math.pow(x-250,2)/30}`); // Sail spines
                p += h("M200,350 L180,450 M300,360 L280,450"); // Legs
                // Texture lines
                for(let x=120; x<400; x+=15) p += h(`M${x},320 Q${x+5},280 ${x},250`);
            }
            return p;
        }
    };
})();
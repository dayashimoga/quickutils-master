window.RealisticDrawings = (function(){
    return {
        genAnimal: function(idx) {
            let p = "";
            if (idx % 2 === 0) {
                // Realistic Cat
                p += window.ColoringHelpers.path("M 200 400 C 150 400 100 350 100 300 C 100 200 150 150 200 150 C 250 150 300 200 300 300 C 300 350 250 400 200 400 Z"); // Body
                p += window.ColoringHelpers.path("M 150 150 L 120 80 L 180 120 Z"); // Left Ear
                p += window.ColoringHelpers.path("M 250 150 L 280 80 L 220 120 Z"); // Right Ear
                p += window.ColoringHelpers.path("M 280 350 C 350 350 380 300 380 250 C 380 200 360 180 340 180 C 330 180 320 190 320 200 C 320 230 350 250 350 300 C 350 330 300 330 280 330"); // Tail
                p += window.ColoringHelpers.path("M 160 200 C 150 200 140 210 140 220 C 140 230 150 240 160 240 C 170 240 180 230 180 220 C 180 210 170 200 160 200 Z"); // Left Eye
                p += window.ColoringHelpers.path("M 240 200 C 230 200 220 210 220 220 C 220 230 230 240 240 240 C 250 240 260 230 260 220 C 260 210 250 200 240 200 Z"); // Right Eye
                p += window.ColoringHelpers.path("M 200 250 L 190 260 L 210 260 Z"); // Nose
                p += window.ColoringHelpers.path("M 200 260 C 180 280 160 270 150 260"); // Mouth L
                p += window.ColoringHelpers.path("M 200 260 C 220 280 240 270 250 260"); // Mouth R
                p += window.ColoringHelpers.path("M 180 250 L 100 230 M 180 260 L 100 260 M 180 270 L 100 290"); // Whiskers L
                p += window.ColoringHelpers.path("M 220 250 L 300 230 M 220 260 L 300 260 M 220 270 L 300 290"); // Whiskers R
            } else {
                // Realistic Fish
                p += window.ColoringHelpers.path("M 100 250 C 150 150 350 150 400 250 C 350 350 150 350 100 250 Z"); // Body
                p += window.ColoringHelpers.path("M 100 250 L 50 180 L 60 250 L 50 320 Z"); // Tail
                p += window.ColoringHelpers.path("M 250 170 L 300 100 L 320 180 Z"); // Top Fin
                p += window.ColoringHelpers.path("M 250 330 L 280 400 L 310 320 Z"); // Bottom Fin
                p += window.ColoringHelpers.path("M 350 240 C 345 240 340 245 340 250 C 340 255 345 260 350 260 C 355 260 360 255 360 250 C 360 245 355 240 350 240 Z"); // Eye
                p += window.ColoringHelpers.path("M 200 200 C 220 220 220 280 200 300"); // Gill
                // Scales
                for (let i = 180; i <= 280; i += 20) {
                    for (let j = 200; j <= 300; j += 20) {
                        if (Math.pow(i - 250, 2) / 10000 + Math.pow(j - 250, 2) / 4000 < 1) {
                            p += window.ColoringHelpers.path(`M ${i} ${j} C ${i+10} ${j+10} ${i+10} ${j-10} ${i} ${j-20}`);
                        }
                    }
                }
            }
            return p;
        },
        genVehicle: function(idx) {
            let p = "";
            if (idx % 2 === 0) {
                // Realistic Sports Car
                p += window.ColoringHelpers.path("M 50 300 L 100 250 L 200 220 L 300 220 L 400 260 L 450 300 Z"); // Top body
                p += window.ColoringHelpers.path("M 50 300 L 450 300 L 450 350 L 50 350 Z"); // Lower body
                p += window.ColoringHelpers.path("M 150 250 L 200 230 L 280 230 L 320 250 Z"); // Windows
                p += window.ColoringHelpers.path("M 120 350 C 120 310 180 310 180 350 C 180 390 120 390 120 350 Z"); // Wheel L
                p += window.ColoringHelpers.path("M 320 350 C 320 310 380 310 380 350 C 380 390 320 390 320 350 Z"); // Wheel R
                p += window.ColoringHelpers.path("M 140 350 C 140 330 160 330 160 350 C 160 370 140 370 140 350 Z"); // Hubcap L
                p += window.ColoringHelpers.path("M 340 350 C 340 330 360 330 360 350 C 360 370 340 370 340 350 Z"); // Hubcap R
                p += window.ColoringHelpers.path("M 400 270 L 440 280 L 440 290 L 400 290 Z"); // Headlight
                p += window.ColoringHelpers.path("M 50 270 L 80 280 L 80 300 L 50 300 Z"); // Taillight
                p += window.ColoringHelpers.path("M 230 230 L 230 300"); // Door line
                p += window.ColoringHelpers.path("M 250 270 L 270 270 L 270 280 L 250 280 Z"); // Door handle
            } else {
                // Realistic Sailboat
                p += window.ColoringHelpers.path("M 100 300 L 400 300 L 350 400 L 150 400 Z"); // Hull
                p += window.ColoringHelpers.path("M 250 100 L 250 300"); // Mast
                p += window.ColoringHelpers.path("M 260 120 L 380 280 L 260 280 Z"); // Main sail
                p += window.ColoringHelpers.path("M 240 140 L 140 280 L 240 280 Z"); // Jib sail
                p += window.ColoringHelpers.path("M 350 320 C 360 320 370 330 370 340 C 370 350 360 360 350 360 C 340 360 330 350 330 340 C 330 330 340 320 350 320 Z"); // Porthole 1
                p += window.ColoringHelpers.path("M 250 320 C 260 320 270 330 270 340 C 270 350 260 360 250 360 C 240 360 230 350 230 340 C 230 330 240 320 250 320 Z"); // Porthole 2
                p += window.ColoringHelpers.path("M 150 320 C 160 320 170 330 170 340 C 170 350 160 360 150 360 C 140 360 130 350 130 340 C 130 330 140 320 150 320 Z"); // Porthole 3
                // Waves
                for (let i = 50; i < 450; i += 40) {
                    p += window.ColoringHelpers.path(`M ${i} 400 C ${i+10} 380 ${i+30} 420 ${i+40} 400`);
                    p += window.ColoringHelpers.path(`M ${i} 420 C ${i+10} 400 ${i+30} 440 ${i+40} 420`);
                }
            }
            return p;
        },
        genDinosaur: function(idx) {
            let p = "";
            if (idx % 2 === 0) {
                // Triceratops
                p += window.ColoringHelpers.path("M 150 250 C 200 150 350 150 400 250 C 450 300 450 350 380 350 L 380 450 L 330 450 L 330 380 L 220 380 L 220 450 L 170 450 L 170 350 C 100 350 100 300 150 250 Z"); // Body
                p += window.ColoringHelpers.path("M 400 250 C 430 200 480 200 480 250 C 480 280 430 300 400 280 Z"); // Head shield
                p += window.ColoringHelpers.path("M 430 220 L 460 150 L 440 220 Z"); // Horn 1
                p += window.ColoringHelpers.path("M 410 210 L 430 140 L 420 210 Z"); // Horn 2
                p += window.ColoringHelpers.path("M 460 260 L 490 250 L 470 270 Z"); // Nose horn
                p += window.ColoringHelpers.path("M 420 250 C 425 250 430 255 430 260 C 430 265 425 270 420 270 C 415 270 410 265 410 260 C 410 255 415 250 420 250 Z"); // Eye
                p += window.ColoringHelpers.path("M 450 280 C 460 290 470 290 470 280"); // Mouth
                // Details
                p += window.ColoringHelpers.path("M 200 250 C 250 200 300 200 350 250");
                p += window.ColoringHelpers.path("M 200 300 C 250 250 300 250 350 300");
                p += window.ColoringHelpers.path("M 380 420 L 360 420 M 380 440 L 360 440");
                p += window.ColoringHelpers.path("M 220 420 L 200 420 M 220 440 L 200 440");
            } else {
                // Stegosaurus
                p += window.ColoringHelpers.path("M 100 350 C 150 250 350 250 400 350 C 450 400 420 420 400 400 L 400 450 L 360 450 L 360 420 L 200 420 L 200 450 L 160 450 L 160 400 C 50 400 50 380 100 350 Z"); // Body
                // Plates
                for(let x=150; x<=350; x+=50) {
                    p += window.ColoringHelpers.path(`M ${x} 280 L ${x+20} 180 L ${x+40} 280 Z`);
                }
                p += window.ColoringHelpers.path("M 420 380 C 430 370 440 370 450 380 C 460 390 460 400 450 410 L 420 400 Z"); // Head
                p += window.ColoringHelpers.path("M 435 385 C 437 385 439 387 439 389 C 439 391 437 393 435 393 C 433 393 431 391 431 389 C 431 387 433 385 435 385 Z"); // Eye
                // Spikes on tail
                p += window.ColoringHelpers.path("M 80 370 L 50 340 L 90 380 Z");
                p += window.ColoringHelpers.path("M 70 380 L 30 360 L 80 390 Z");
            }
            return p;
        }
    };
})();

// TODO: Rewrite this entire file into something like a class for more structure in drawing different things

// TODO: Add lensflares for planets
// TODO: Create list of all currently plotted positions, to quickly iterate over these to find the closest planet etc. for efficient drawing of moons perhaps
//       This might need 2 extra properties of Orbiter: - <parentOrbiter> and/or <childOrbiters> pointers to quickly go through the tree
//                                                      - <ChildRenderDistance> for the size of the sphere of influence to begin rendering moons etc. of a planet
// TODO: Add sidebar in HTML to play with settings
// TODO: Actually add the Moon in planets.js maybe idk
// TODO: Rotations of Orbiters around their own axis itself
// TODO: Switch between OrbitControls (maybe choose center body in sidebar) and FlyControls (scrolling increases/decreases fly speed)
// TODO: For all this sidebar stuff, maybe create a new Settings class idk
//       update: a Settings object has been created, further interaction with main program still needs to be written

import * as THREE from 'https://unpkg.com/three@0.118.3/build/three.module.js';
// import { TrackballControls } from 'https://unpkg.com/three@0.118.3/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'https://unpkg.com/three@0.118.3/examples/jsm/controls/OrbitControls.js';
import { Lensflare, LensflareElement } from 'https://unpkg.com/three@0.118.3/examples/jsm/objects/Lensflare.js';
import * as CORE from './classes.js';
import {unit} from './units.js';
import * as SETTINGS from './settings.js';


var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.001, 1000);
camera.up.set( 0, 0, 1 );
camera.position.z = 1;
camera.position.y = 3;

var renderer = new THREE.WebGLRenderer({canvas:document.getElementById('mainCanvas'), antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
document.body.appendChild(renderer.domElement);


let t = Date.now() //+ 5200000e3

//// SUN ////
let sunlight = new THREE.PointLight( 0xffffff, 1, 100, 2);
sunlight.position.set(0,0,0);

/// Shadows
sunlight.castShadow = true; // default <false>
let planetShadows = false;
// sunlight.shadow.mapSize.width = 1024;  // default <512>
// sunlight.shadow.mapSize.height = 1024; // default <512>
sunlight.shadow.camera.near = 0.001;  // default <0.5>
// sunlight.shadow.camera.far = 500      // default <500>
scene.add(sunlight);

/// Lens flare
var textureLoader = new THREE.TextureLoader();
var textureFlare0 = textureLoader.load( "data/textures/lensflares/lensflare0.png" );
var textureFlare1 = textureLoader.load( "data/textures/lensflares/lensflare3.png" );
var lensflare = new Lensflare();
let firstLensFlare = new LensflareElement( textureFlare0, 100, 0 );
lensflare.addElement( firstLensFlare );
lensflare.addElement( new LensflareElement( textureFlare1, 60, 0.6 ) );
sunlight.add( lensflare );


//// PLANETS ////
function initializeOrbiters(orbiterClass='planet', enlargement=1) {
    for (let i = 0; i < CORE.Orbiter.types[orbiterClass].length; i++) {
        let planet = CORE.Orbiter.types[orbiterClass][i];

        /// Main geometry and rotation
        let geometry = new THREE.SphereGeometry(planet.graphics.radius.in('AU')*enlargement, 50, 50);
        geometry.rotateZ(-Math.PI/2);
        geometry.rotateX(Math.PI/2); // Instead of y axis 'up', put z axis 'up'
        // The +y axis is pointing from the earth to the sun at the summer solstice (21 june), so that's the orientation we have to keep in mind
        let material;

        if (planet.graphics.hasTexture) { // use texture
            let loader = new THREE.TextureLoader();
            material = new THREE.MeshPhongMaterial( { map: loader.load(planet.graphics.textureFile)})
        } else { // use color
            material = new THREE.MeshPhongMaterial( { color: planet.graphics.color.hex } );
        }
        let sphere = new THREE.Mesh( geometry, material );
        planet.graphics.mesh = sphere;
        sphere.castShadow = planetShadows; // default <false>
        sphere.receiveShadow = planetShadows; // default <false>
        scene.add(sphere);

        
        drawEllipse(planet.orbit, t, planet.graphics.color.hex);
    }
}
initializeOrbiters('planet', 500);
// initializeOrbiters('moon', 500);
// initializeOrbiters('dwarfplanet', 10000);
updateOrbiterPositions(t, 'planet');
// updateOrbiterPositions(t, 'moon');
// updateOrbiterPositions(t, 'dwarfplanet');

function updateOrbiterPosition(t, orbiter) { // Can probably be a method of Orbiter()
    const currentPos = orbiter.graphics.mesh.position;
    const pos = orbiter.position(t, 'ms', 'AU');

    orbiter.graphics.mesh.translateX(pos.x-currentPos.x); // Shifted for y axis up
    orbiter.graphics.mesh.translateY(pos.y-currentPos.y);
    orbiter.graphics.mesh.translateZ(pos.z-currentPos.z);
}

function updateOrbiterPositions(t, orbiterClass='planet') {
    for (let i = 0; i < CORE.Orbiter.types[orbiterClass].length; i++) {
        updateOrbiterPosition(t, CORE.Orbiter.types[orbiterClass][i]);
    }
}

function updateOrbiterRotation(t, orbiter) {
    // Rotation() class should hold a matrix which rotates everything up to the axis
    // Then one could left-multiply this matrix with a rotation about this axis for every t
}

let controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 1.0;controls.zoomSpeed = 1.2;controls.panSpeed = 0.8;controls.maxDistance = 100;
controls.keys = [ 65, 83, 68 ];

function flareSize(sunSize, F_plus=Math.min(window.innerWidth, window.innerHeight)/5, F_min=F_plus/1.5, S_plus=Math.min(window.innerWidth, window.innerHeight)/100, S_min=1) {
    if (sunSize < S_min) {
        return (-F_min/S_min**2)*sunSize**2 + (2*F_min/S_min)*sunSize //   sunSize*plateauHeight/minPlateau
    } else if (sunSize < S_plus) {
        // let cubic = (S_min - S_plus)**3;
        // let a = -(2*F_min*S_plus-F_plus*S_min-F_plus*S_plus)/(S_plus*cubic);
        // let b = (3*F_min*S_min*S_plus+3*F_min*S_plus*S_plus-2*F_plus*S_min*S_min-2*F_plus*S_min*S_plus-2*F_plus*S_plus*S_plus)/(S_plus*cubic);
        // let c = -S_min*(6*F_min*S_plus*S_plus-F_plus*S_min*S_min-F_plus*S_min*S_plus-4*F_plus*S_plus*S_plus)/(S_plus*cubic);
        // let d = S_plus*(3*F_min*S_min*S_plus-F_min*S_plus*S_plus-2*F_plus*S_min*S_min)/cubic;
        // return a*sunSize**3+b*sunSize**2+c*sunSize+d;

        let square = (S_min - S_plus)**2;
        return (F_plus-F_min)/square*sunSize**2 + 2*S_min*(F_min-F_plus)/square*sunSize - (2*F_min*S_min*S_plus-F_min*S_plus*S_plus-F_plus*S_min*S_min)/square
        
        // return F_min + (F_plus - F_min)/(S_plus - S_min)*(sunSize-S_min)
    } else {
        return sunSize*F_plus/S_plus
    }
}

function drawEllipse(orbit, t=0, color=0xff0000) {
    let a = orbit.a.at(t, 'ms', 'AU');
    let b = a*Math.sqrt(1-orbit.e.at(t)**2);
    let c = a*orbit.e.at(t);
    let center = orbit.ref.position(t, 'ms', 'AU');
    let curve = new THREE.EllipseCurve(
        -c,  0,            // x0, y0
        a, b,           // xRadius, yRadius
        0,  2 * Math.PI,  // StartAngle, EndAngle
        false,            // Clockwise
        0                 // Rotation
    );
    curve.autoClose = true;
    let geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(500));
    let material = new THREE.LineBasicMaterial( { color : color } );
    let line = new THREE.Line( geometry, material );
    line.position.set( center.x, center.y, center.z );

    let m = orbit.ref.getMatrix().multiply(getEulerMatrix(orbit.Omega.at(t, 'ms', 'rad'), orbit.i.at(t, 'ms', 'rad'), orbit.omega.at(t, 'ms', 'rad')));
    line.rotation.setFromRotationMatrix(m, 'XYZ');

    scene.add(line);
}

// TODO: Can maybe put this in new module file for importing everywhere?
function getEulerMatrix(angleZ0, angleX, angleZ1) {
    let c1, c2, c3, s1, s2, s3;
    c1 = Math.cos(angleZ0);s1 = Math.sin(angleZ0);
    c2 = Math.cos(angleX);s2 = Math.sin(angleX);
    c3 = Math.cos(angleZ1);s3 = Math.sin(angleZ1);
    let m = new THREE.Matrix4();
    m.set( c1*c3-c2*s1*s3, -c1*s3-c2*c3*s1, s1*s2, 0,
        c3*s1+c1*c2*s3, c1*c2*c3-s1*s3, -c1*s2, 0,
        s2*s3, c3*s2, c2, 0,
        0,0,0,1);
    return m
}
function getRotationFromMatrix(m, order='ZXZ') {
    // The matrix m is expected to be 4x4
    switch (order) {
        case 'ZXZ':
            let r22 = m.elements[10];
            let thetaZ0, thetaX, thetaZ1;
            if (r22 < 1) {
                if (r22 > -1) {
                    let r02 = m.elements[8], r12 = m.elements[9], r20 = m.elements[2], r21 = m.elements[6];
                    thetaX = Math.acos(r22);
                    thetaZ0 = Math.atan2(r02,-r12);
                    thetaZ1 = Math.atan2(r20,r21);
                } else { // r22 = 1
                    let r10 = m.elements[1], r11 = m.elements[5];
                    thetaY = Math.PI;
                    thetaZ0 = -atan2(r10,r11);
                    thetaZ1 = 0;
                }
            } else {
                let r01 = m.elements[4], r00 = m.elements[0];
                thetaX = 0;
                thetaZ0 = Math.atan2(-r01,r00);
                thetaZ1 = 0;
            }
            return [thetaZ0, thetaX, thetaZ1]
    }
}

initializeSwitches();
function initializeSwitches() {
    let switches = document.getElementsByClassName('switch');
    for (let i=0; i < switches.length; i++) {
        let settingName = switches[i].id.split('setting_').pop();
        let inputElement = switches[i].getElementsByTagName('input')[0];
        SETTINGS.toggle(settingName, inputElement.checked);
        settingUpdated(settingName);
        switches[i].addEventListener('click', function() {
            SETTINGS.toggle(settingName);
            settingUpdated(settingName);
        }); // TODO: how to add consequences to this? maybe function with switch statement? Maybe rewrite drawing stuff into a class or something
    }
}

function settingUpdated(settingName) {
    switch (settingName) {
        case 'DRAW_ORBITS':
            if (SETTINGS.get('DRAW_ORBITS')) {
                // TODO: Draw them
            } else {
                // TODO: Erase them
            }
            break;
    }
}



function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    // controls.handleResize();
    // console.log(camera, sunlight);
}
window.addEventListener('resize', onWindowResize, false);

function animate() {
	requestAnimationFrame( animate );
    renderer.render( scene, camera );
    controls.update();

    let sunSize = Math.min(window.innerWidth, window.innerHeight)*(unit(unit(5e5, 'km', 'AU')/Math.sqrt(camera.position.x**2+camera.position.y**2+camera.position.z**2), 'rad', 'deg')/camera.fov)
    let flare = flareSize(sunSize);
    firstLensFlare.size = flare*(Math.random()+10)/10;

    // t += 1e7
    // updateOrbiterPositions(t, 'planet');
    // updateOrbiterPositions(t, 'dwarfplanet');
    // updateOrbiterPositions(t, 'moon');

    // Update time div
    document.getElementById('time').innerHTML = new Date(t).toUTCString(t);
}
animate();
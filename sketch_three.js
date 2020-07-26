import * as THREE from 'https://unpkg.com/three@0.118.3/build/three.module.js';
// import { TrackballControls } from 'https://unpkg.com/three@0.118.3/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'https://unpkg.com/three@0.118.3/examples/jsm/controls/OrbitControls.js';
import { Lensflare, LensflareElement } from 'https://unpkg.com/three@0.118.3/examples/jsm/objects/Lensflare.js';
import * as CORE from './classes.js';

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.001, 1000);
camera.up.set( 0, 0, 1 );
camera.position.z = 1;
camera.position.y = 3;

var renderer = new THREE.WebGLRenderer({canvas:document.getElementById("mainCanvas"), antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
document.body.appendChild(renderer.domElement);


let t = Date.now()

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

var textureFlare0 = textureLoader.load( "data/textures/lensflare0.png" );
var textureFlare1 = textureLoader.load( "data/textures/lensflare3.png" );
var lensflare = new Lensflare();

let firstLensFlare = new LensflareElement( textureFlare0, 100, 0 );
lensflare.addElement( firstLensFlare );
lensflare.addElement( new LensflareElement( textureFlare1, 60, 0.6 ) );
sunlight.add( lensflare );


//// PLANETS ////
function initializeOrbiters(orbiterClass='planet', enlargement=1) {
    for (let i = 0; i < CORE.Orbiter.types[orbiterClass].length; i++) {
        let planet = CORE.Orbiter.types[orbiterClass][i];

        /// Main geometry
        let geometry = new THREE.SphereGeometry(planet.graphics.radius.in('AU')*enlargement, 50, 50);
        let material = new THREE.MeshPhongMaterial( { color: planet.graphics.color.hex } );
        let sphere = new THREE.Mesh( geometry, material );
        planet.graphics.mesh = sphere;
        sphere.castShadow = planetShadows; // default <false>
        sphere.receiveShadow = planetShadows; // default <false>
        scene.add(sphere);

        
        drawEllipse(planet.orbit);
    }
}
initializeOrbiters('planet', 500);
initializeOrbiters('dwarfplanet', 10000);
updateOrbiterPositions(t, 'planet');
updateOrbiterPositions(t, 'dwarfplanet');

function updateOrbiterPositions(t, orbiterClass='planet') {
    for (let i = 0; i < CORE.Orbiter.types[orbiterClass].length; i++) {
        let planet = CORE.Orbiter.types[orbiterClass][i];

        let currentPos = planet.graphics.mesh.position;
        let pos = planet.position(t, 'AU');

        planet.graphics.mesh.translateX(pos.x-currentPos.x); // Shifted for y axis up
        planet.graphics.mesh.translateY(pos.y-currentPos.y);
        planet.graphics.mesh.translateZ(pos.z-currentPos.z);
        // console.log(currentPos, pos)
    }
}

let controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 1.0;controls.zoomSpeed = 1.2;controls.panSpeed = 0.8;
controls.keys = [ 65, 83, 68 ];

function flareSize(sunSize, plateauHeight=Math.min(window.innerWidth, window.innerHeight)/5, maxPlateau=Math.min(window.innerWidth, window.innerHeight)/100, minPlateau=1) {
    if (sunSize < minPlateau) {
        return sunSize*plateauHeight/minPlateau
    } else if (sunSize < maxPlateau) {
        return plateauHeight
    } else {
        return sunSize*plateauHeight/maxPlateau
    }
}

function drawEllipse(orbit, t=0) {
    let a = orbit.a.at(t, 'ms', 'AU');
    let b = a*Math.sqrt(1-orbit.e.at(t)**2);
    let c = a*orbit.e.at(t);
    let center = orbit.ref.position(t, 'AU');
    let curve = new THREE.EllipseCurve(
        -c,  0,            // x0, y0
        a, b,           // xRadius, yRadius
        0,  2 * Math.PI,  // StartAngle, EndAngle
        false,            // Clockwise
        0                 // Rotation
    );
    curve.autoClose = true;
    let geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(500));
    let material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    let line = new THREE.Line( geometry, material );
    line.position.set( center.x, center.y, center.z );

    let c1, c2, c3, s1, s2, s3;
    let Omega, i, omega;
    Omega = orbit.Omega.at(t, 'ms', 'rad');
    i = orbit.i.at(t, 'ms', 'rad');
    omega = orbit.omega.at(t, 'ms', 'rad');
    c1 = Math.cos(Omega);s1 = Math.sin(Omega);
    c2 = Math.cos(i);s2 = Math.sin(i);
    c3 = Math.cos(omega);s3 = Math.sin(omega);
    let m = new THREE.Matrix4();
    m.set( c1*c3-c2*s1*s3, -c1*s3-c2*c3*s1, s1*s2, 0,
        c3*s1+c1*c2*s3, c1*c2*c3-s1*s3, -c1*s2, 0,
        s2*s3, c3*s2, c2, 0,
        0,0,0,1);
    line.rotation.setFromRotationMatrix(m, 'XYZ');

    scene.add(line);
}



function onWindowResize() {
    var aspect = window.innerWidth / window.innerHeight;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    // controls.handleResize();
    console.log(camera, sunlight);
}
window.addEventListener('resize', onWindowResize, false);

function animate() {
	requestAnimationFrame( animate );
    renderer.render( scene, camera );
    controls.update();

    let sunSize = Math.min(window.innerWidth, window.innerHeight)*(CORE.unit(CORE.unit(5e5, 'km', 'AU')/Math.sqrt(camera.position.x**2+camera.position.y**2+camera.position.z**2), 'rad', 'deg')/camera.fov)
    firstLensFlare.size = flareSize(sunSize)*(Math.random()+10)/10;

    t += 1e8
    updateOrbiterPositions(t, 'planet');
    updateOrbiterPositions(t, 'dwarfplanet');
}
animate();
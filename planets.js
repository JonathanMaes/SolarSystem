/*
	Source for planets: http://www.met.rdg.ac.uk/~ross/Astronomy/Planets.html#elems
*/
import {ReferencePlane, FreeReferencePlane, Orbit, NullOrbit, Parameter, Orbiter, Graphics, Rotation} from './classes.js';
import {unit} from './units.js';

let sol = new FreeReferencePlane(new Parameter(1, 'M☉'));
let equatorial_sol = new FreeReferencePlane(new Parameter(1, 'M☉'), 0, 0, 0, 0, -23.4, 0);

// Mercury
let mercury_orbit = new Orbit(sol, {
	Omega: new Parameter([48.33167, unit(-446.3, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([7.00487, unit(-23.51, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([77.45645, unit(573.57, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([0.38709893, 0.00000066], 'AU', 'Cy'),
	e: new Parameter([0.20563069, 0.00002527], '', 'Cy'),
	L0: new Parameter([252.25084, unit(538101628.29, 'as', 'deg')], 'deg', 'Cy')
});
let mercury = new Orbiter('Mercury', 'planet', mercury_orbit, {graphics:new Graphics(192, new Parameter(2439.7, 'km'))});

// Venus
let venus_orbit = new Orbit(sol, {
	Omega: new Parameter([76.68069, unit(-996.89, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([3.39471, unit(-2.86, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([131.53298, unit(-108.80, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([0.72333199, 0.00000092], 'AU', 'Cy'),
	e: new Parameter([0.00677323, -0.00004938], '', 'Cy'),
	L0: new Parameter([181.97973, unit(210664136.06, 'as', 'deg')], 'deg', 'Cy')
});
let venus = new Orbiter('Venus', 'planet', venus_orbit, {graphics:new Graphics([255,192,150], new Parameter(6051.8, 'km'))});

// Earth
let earth_orbit = new Orbit(sol, {
	Omega: new Parameter([-11.26064, unit(-18228.25, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([0.00005, unit(-46.94, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([102.94719, unit(1198.28, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([1.00000011, -0.00000005], 'AU', 'Cy'),
	e: new Parameter([0.01671022, -0.00003804], '', 'Cy'),
	L0: new Parameter([100.46435, unit(129597740.63, 'as', 'deg')], 'deg', 'Cy')
});
let earth_graphics = new Graphics([0,0,255], new Parameter(6371.00, 'km'), {textureFile:'data/textures/planets/earth.jpg'});
let earth_rotation = new Rotation(equatorial_sol, 0, 90, new Parameter([0, 360.99], 'deg', 'day'));
let earth = new Orbiter('Earth', 'planet', earth_orbit, {graphics:earth_graphics, rotation:earth_rotation});

// Mars
let mars_orbit = new Orbit(sol, {
	Omega: new Parameter([49.57854, unit(-1020.19, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([1.85061, unit(-25.47, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([336.04084, unit(1560.78, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([1.52366231, -0.00007221], 'AU', 'Cy'),
	e: new Parameter([0.09341233, 0.00011902], '', 'Cy'),
	L0: new Parameter([355.45332, unit(68905103.78, 'as', 'deg')], 'deg', 'Cy')
});
let mars = new Orbiter('Mars', 'planet', mars_orbit, {graphics:new Graphics([255,80,80], new Parameter(3389.5, 'km'))});

// Jupiter
let jupiter_orbit = new Orbit(sol, {
	Omega: new Parameter([100.55615, unit(1217.17, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([1.30530, unit(-4.15, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([14.75385, unit(839.93, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([5.20336301, 0.00060737], 'AU', 'Cy'),
	e: new Parameter([0.04839266, -0.00012880], '', 'Cy'),
	L0: new Parameter([34.40438, unit(10925078.35, 'as', 'deg')], 'deg', 'Cy')
});
let jupiter = new Orbiter('Jupiter', 'planet', jupiter_orbit, {graphics:new Graphics([255,150,150], new Parameter(69911, 'km'))});

// Saturn
let saturn_orbit = new Orbit(sol, {
	Omega: new Parameter([113.71504, unit(-1591.05, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([2.48446, unit(6.11, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([92.43194, unit(-1948.89, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([9.53707032, -0.00301530], 'AU', 'Cy'),
	e: new Parameter([0.05415060, -0.00036762], '', 'Cy'),
	L0: new Parameter([49.94432, unit(4401052.95, 'as', 'deg')], 'deg', 'Cy')
});
let saturn = new Orbiter('Saturn', 'planet', saturn_orbit, {graphics:new Graphics([200,200,100], new Parameter(58232, 'km'))});

// Uranus
let uranus_orbit = new Orbit(sol, {
	Omega: new Parameter([74.22988, unit(-1681.40, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([0.76986, unit(-2.09, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([170.96424, unit(1312.56, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([19.19126393, 0.00152025], 'AU', 'Cy'),
	e: new Parameter([0.04716771, -0.00019150], '', 'Cy'),
	L0: new Parameter([313.23218, unit(1542547.79, 'as', 'deg')], 'deg', 'Cy')
});
let uranus = new Orbiter('Uranus', 'planet', uranus_orbit, {graphics:new Graphics([0,100,255], new Parameter(25362, 'km'))});

// Neptune
let neptune_orbit = new Orbit(sol, {
	Omega: new Parameter([131.72169, unit(-151.25, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([1.76917, unit(-3.64, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([44.97135, unit(-844.43, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([30.06896348, -0.00125196], 'AU', 'Cy'),
	e: new Parameter([0.00858587, 0.0000251], '', 'Cy'),
	L0: new Parameter([304.88003, unit(786449.21, 'as', 'deg')], 'deg', 'Cy')
});
let neptune = new Orbiter('Neptune', 'planet', neptune_orbit, {graphics:new Graphics([0,0,255], new Parameter(24622, 'km'))});

// Pluto
let pluto_orbit = new Orbit(sol, {
	Omega: new Parameter([110.30347, unit(-37.33, 'as', 'deg')], 'deg', 'Cy'),
	i: new Parameter([17.14175, unit(11.07, 'as', 'deg')], 'deg', 'Cy'),
	omegabar: new Parameter([224.06676, unit(-132.25, 'as', 'deg')], 'deg', 'Cy'),
	a: new Parameter([39.48168677, -0.00076912], 'AU', 'Cy'),
	e: new Parameter([0.24880766, 0.00006465], '', 'Cy'),
	L0: new Parameter([238.92881, unit(522747.90, 'as', 'deg')], 'deg', 'Cy')
});
let pluto = new Orbiter('Pluto', 'dwarfplanet', pluto_orbit, {graphics:new Graphics(255, new Parameter(1135, 'km'))})

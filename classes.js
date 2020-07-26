// TODO: propagate position through Orbit -> ReferencePlane -> Orbit -> ReferencePlane -> ... -> NullReferencePlane


class ReferencePlane {
	constructor(orbit, M) {
		/*
			x : x coordinate of origin
			y : y coordinate of origin
			z : z cooridnate of origin
			phi : obliquity
			theta : some angle or something
			psi : some other angle or something
			M : mass of central body
		*/
		this.orbit = orbit;
	}

	get GM() {
		return this.M*6.67408e-11;
	}

	position(t, outputUnit='m') {
		return this.orbit.position(t, outputUnit=outputUnit)
	}
}

class FreeReferencePlane {
	constructor(M, x=new Parameter(0, 'm'), y=new Parameter(0, 'm'), z=new Parameter(0, 'm'), phi=new Parameter(0, 'rad'), theta=new Parameter(0, 'rad'), psi=new Parameter(0, 'rad')) {
		/*
			M : mass of central body
			x : x coordinate of origin
			y : y coordinate of origin
			z : z cooridnate of origin
			phi : obliquity
			theta : some angle or something
			psi : some other angle or something
		*/
		this.x = x.in('m');
		this.y = y.in('m');
		this.z = z.in('m');
		this.phi = phi.in('rad');
		this.theta = theta.in('rad');
		this.psi = psi.in('rad');
		this.M = M;
	}

	get GM() {
		return this.M*6.67408e-11;
	}

	position(t, outputUnit='m') {
		return {x:unit(this.x, 'm', outputUnit), y:unit(this.y, 'm', outputUnit), z:unit(this.z, 'm', outputUnit)}
	}
}


class Orbit {
	constructor(ref, {Omega, i, e, omega, omegabar, a, q, n, M0, L0}={}) {
		/*
			If any orbital parameter is specified as a function of time,
			this time should be in MILLISECONDS SINCE JULIAN EPOCH
			@param ref [ReferencePlane]: Plane of reference for this orbit
			@param Omega [Parameter] [deg] erm i mean [rad]: Longitude of ascending node
			@param i [Parameter] [deg] erm i mean [rad]: Inclination to reference plane
			@param e [Parameter] [-]: Eccentricity
			@param <omega> [Parameter] [deg] erm i mean [rad]: Argument of perihelion
			@param~ <omegabar> [Parameter] [deg] erm i mean [rad]: Longitude of perihelion (= Omega + omega)
			@param <a> [Parameter] [m]: Semi-major axis
			@param~ <q> [Parameter] [m]: Distance of periapsis
			@param~ <n> [Parameter] [rad/s]: Mean motion
			@param <M0> [Parameter] [deg] erm i mean [rad]: Mean anomaly at epoch
			@param~ <L0> [Parameter] [deg] erm i mean [rad]: Longitude at epoch (= M0 + Omega + omega)
		*/
		this.ref = ref; // Reference plane object

		// Orbital elements
		this.Omega = Omega.convertUnit('rad'); // Longitude of ascending node
		this.i = i.convertUnit('rad'); // Inclination to reference plane
		this.e = e; // Eccentricity
		if (omega) { // Argument of perihelion
			this.omega = omega.convertUnit('rad');
		} else if (omegabar) { // Longitude of perihelion
			this.omega = omegabar.convertUnit('rad').subtract(this.Omega);
		} else {
			throw `Parameter 'omega' (or equivalent parameter) undefined.`;
		}
		if (a) { // Semi-major axis
			this.a = a.convertUnit('m');
		} else if (q) { // Distance of periapsis
			// Formula is: a = q/(1-e)
			this.a = q.convertUnit('m').applyFunction(((a, b) => a/(1-b)), 'm', q.timeStepUnit, this.e);
		} else if (n) { // Mean motion
			this.a = n.applyFunction((x => Math.cbrt(this.ref.GM/x**2)), 'm', n.timeStepUnit);
		} else {
			throw `Parameter 'a' (or equivalent parameter) undefined.`;
		}
		if (M0) { // Mean anomaly at epoch
			this.M0 = M0.convertUnit('rad');
		} else if (L0) { // Longitude at epoch
			this.M0 = L0.convertUnit('rad').subtract(this.Omega).subtract(this.omega);
		} else {
			throw `Parameter 'M0' (or equivalent parameter) undefined.`;
		}
		
		// Other useful constants for a certain orbit
		this.P = this.a.applyFunction((x => 2*Math.PI*Math.sqrt(x**3/this.ref.GM)), 's', this.a.timeStepUnit) ; // Period [s]
	}

	position(t, outputUnit='m') {
		/*
			t : timestamp in milliseconds since Javascript epoch (i.e. 1970)
			return : {x:, y:, z:}
		*/
	   
		if (!t) {
			t = Date.now()
		}

		//// Step 1: get delta_t
		let epoch = new Date(2000, 0, 1, 11, 58, 55, 816); // January 1, 2000, 11:58:55.816 UTC
		let delta_t = t - epoch.getTime(); // Milliseconds from epoch to t

		// Get all 'this.' orbit parameters at time delta_t into local variables
		let Omega = this.Omega.at(delta_t);
		let i = this.i.at(delta_t);
		let e = this.e.at(delta_t);
		let omega = this.omega.at(delta_t);
		let a = this.a.at(delta_t);
		let M0 = this.M0.at(delta_t);
		
		let P = this.P.at(delta_t);

		//// Step 2: iterate to get the eccentric anomaly
		let M;
		if (this.M0.length == 1) { // Only start-M0 given, so extrapolate via P
			M = delta_t/(1000*P)*2*Math.PI + M0; // Mean anomaly
		} else {
			M = M0;
		}
		let E = M; let dE = Infinity; // Eccentric anomaly
		while(Math.abs(dE) > 1e-6) {
			dE = (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E));
			E -= dE;
		}

		//// Step 3: find x,y coordinate along this ellipse
		let x = a*(Math.cos(E) - e);
		let y = a*Math.sin(E)*Math.sqrt(1 - e**2);
		let z = 0, temp;

		//// Step 4: multiply coordinate with matrices in order to rotate elliptic orbit into correct position
		// Rotate point by argument of periapsis around z-axis
		temp = x;
		x = Math.cos(omega)*x - Math.sin(omega)*y;
		y = Math.sin(omega)*temp + Math.cos(omega)*y;
		// Rotate point by inclination around x-axis
		temp = y;
		y = Math.cos(i)*y - Math.sin(i)*z; 
		z = Math.sin(i)*temp + Math.cos(i)*z;
		// Rotate point by longitude of ascending node around z-axis
		temp = x;
		x = Math.cos(Omega)*x - Math.sin(Omega)*y; 
		y = Math.sin(Omega)*temp + Math.cos(Omega)*y;

		//// Step 5: move this also according to the angles of the reference plane
		// Rotate point by psi around z-axis
		temp = x;
		x = Math.cos(this.ref.psi)*x - Math.sin(this.ref.psi)*y;
		y = Math.sin(this.ref.psi)*temp + Math.cos(this.ref.psi)*y;
		// Rotate point by theta around x-axis
		temp = y;
		y = Math.cos(this.ref.theta)*y - Math.sin(this.ref.theta)*z;
		z = Math.sin(this.ref.theta)*temp + Math.cos(this.ref.theta)*z; 
		// Rotate point by phi around z-axis
		temp = x;
		x = Math.cos(this.ref.phi)*x - Math.sin(this.ref.phi)*y; 
		y = Math.sin(this.ref.phi)*temp + Math.cos(this.ref.phi)*y;

		// Tadaa, we have the actual x,y,z coordinate in our master reference frame!
		return {x:unit(x, 'm', outputUnit),y:unit(y, 'm', outputUnit),z:unit(z, 'm', outputUnit)}
	}
}

class NullOrbit {
	constructor(ref) {
		/*
			This is an 'orbit' at the exact center of the reference plane
			@param ref [ReferencePlane]: Plane of reference for this orbit
		*/
		this.ref = ref; // Reference plane object

		// Orbital elements
		this.Omega = new Parameter(0, 'rad'); // Longitude of ascending node
		this.i = new Parameter(0, 'rad'); // Inclination to reference plane
		this.e = new Parameter(0, ''); // Eccentricity
		this.omega = new Parameter(0, 'rad'); // Argument of perihelion
		this.a = new Parameter(0, 'm'); // Semi-major axis
		this.M0 = new Parameter(0, 'rad'); // Mean anomaly at epoch
		this.P = new Parameter(1, 's'); // Period [s]
	}

	position(t=0) {
		return {x:0,y:0,z:0}
	}
}

class Orbiter {
	constructor(name, type, orbit, {graphics}={}) {
		/*
			@param name [str]: Name of the object
			@param <type> [str]: Type of this object (e.g. 'planet', 'asteroid', 'comet', ...)
			@param orbit [Orbit]: The orbit that this orbiter follows.
		*/
		this.name = name; // Name of the object occupying this orbit
		this.orbit = orbit;
		if (graphics) {
			this.graphics = graphics;
		} else {
			this.graphics = new Graphics(255, new Parameter(1, 'm'));
		}

		// Add this to this type
		this.type = type || '';
		if (Orbiter.types[this.type]) { // If there already exists an object of the same type
			Orbiter.types[this.type].push(this);
		} else { // If this is the first object of this type
			Orbiter.types[this.type] = [this];
		}
	}

	position(t, outputUnit='m') {
		return this.orbit.position(t, outputUnit=outputUnit);
	}
}
Orbiter.types = {}

class Parameter {
	constructor(array, unit, timeStepUnit='ms') {
		if (!Array.isArray(array)) {
			array = [array];
		}
		this.array = array;
		this.val = array[0];
		this.unit = unit;
		this.timeStepUnit = timeStepUnit;
		this.length = array.length;
	}

	at(t, timeStepUnit='ms', outputUnit=this.unit) {
		return unit(this.array.reduce((accumulator, currentValue, index, array) => accumulator + currentValue*unit(t, timeStepUnit, this.timeStepUnit)**index), this.unit, outputUnit)
		
	}

	in(outputUnit) {
		return unit(this.val, this.unit, outputUnit);
	}

	convertUnit(to) {
		let newArray = [];
		for (let i = 0; i < this.array.length; i++) {
			newArray.push(unit(this.array[i], this.unit, to))
		}
		return new Parameter(newArray, to, this.timeStepUnit)
	}

	add(other) {
		let newArray = [];
		for (let i = 0; i < Math.min(this.array.length, other.array.length); i++) {
			newArray.push(this.array[i] + unit(unit(other.array[i], other.unit, this.unit), this.timeStepUnit, other.timeStepUnit))
		}
		return new Parameter(newArray, this.unit, this.timeStepUnit)
	}

	subtract(other) {
		let newArray = [];
		for (let i = 0; i < Math.min(this.array.length, other.array.length); i++) {
			newArray.push(this.array[i] - unit(unit(other.array[i], other.unit, this.unit), this.timeStepUnit, other.timeStepUnit))
		}
		return new Parameter(newArray, this.unit, this.timeStepUnit)
	}

	applyFunction(fun, newUnit, newTimeStepUnit) {
		/*
			@param fun: Takes as arguments [this parameter, other optional parameter, other optional parameter, ...]
			@param newUnit: Specify the new unit because otherwise detecting it will inevitably be a mess
			@param newTimeStepUnit: Specify the new time unit because otherwise detecting it will inevitably be a mess
			@param ...: When more than 3 arguments are given, these additional arguments are treated as arguments to 'fun'.
		*/
		if (newUnit && newTimeStepUnit) {
			let newArray = [];
			for (let i = 0; i < this.array.length; i++) {
				newArray.push(fun(...[this.array[i], ...(Array.prototype.slice.call(arguments, 3)).map(x=>x.array[i])]))
			}
			return new Parameter(newArray, newUnit, newTimeStepUnit)
		} else {
			throw `The new unit and/or time unit was not defined. Please specify the resulting unit as a second argument, as it is not possible to calculate the new correct unit for a complex function.`
		}
	}
}

class Graphics {
	constructor(color, radius) {
		let r, g, b;
		if (Number.isInteger(color)) { // Greyscale
			r = color; g = color; b = color;
		} else if (Array.isArray(color)){
			if (color.length == 3) {
				r = color[0]; g = color[1]; b = color[2];
			}
		}
		this.color = {r:r, g:g, b:b, hex:r*65536+g*256+b}
		this.radius = radius;

		this.isThree = false;
	}

	set mesh(threeMesh) {
		this.threeMesh = threeMesh;
		this.isThree = true;
	}

	get mesh() {
		if (this.isThree) {
			return this.threeMesh
		} else {
			raise `Tried to access mesh, but this object does not have a mesh.`
		}
	}
	get geometry() {
		if (this.isThree) {
			return this.threeMesh.geometry
		} else {
			raise `Tried to access geometry, but this object is not a three.js object.`
		}
	}
	get material() {
		if (this.isThree) {
			return this.threeMesh.material
		} else {
			raise `Tried to access material, but this object is not a three.js object.`
		}
	}
}


function unit(n, from, to) {
	//console.log(`${n}, ${from}, ${to}`);
	if (from == to) {
		return n // This is what stops the recursion
	}
	switch (from) {
		case 'm': case 'rad': case 's': // These are fundamental units, so just convert the units now
			return n/unit(1, to, from) // unit(n, to, from) yields the conversion coefficient

		case 'AU':
			return unit(n*149597870700, 'm', to || 'm')
		case 'km':
			return unit(n*1000, 'm', to || 'm')

		case 'deg':
			return unit(n/180*Math.PI, 'rad', to || 'rad')
		case 'arcsec': case 'as': case '"':
			return unit(n/3600, 'deg', to || 'deg')

		case 'ms':
			return unit(n/1000, 's', to || 's')
		case 'hour': case 'hours':
			return unit(n*3600, 's', to || 's')
		case 'day': case 'days':
			return unit(n*86400, 's', to || 's')
		case 'year':case 'years':
			return unit(n*31557600, 's', to || 's')
		case 'century': case 'centuries': case 'Cy':
			return unit(n*3155760000, 's', to || 's')
		
		default:
			raise `Unit '${from}' unknown.`
			return undefined // If 'from' is not a known unit
	}
}

export {ReferencePlane, FreeReferencePlane, Orbit, NullOrbit, Orbiter, Parameter, Graphics, unit}
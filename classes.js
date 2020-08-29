// TOOD: Rewrite documentation in jsdoc format just for lolz idk
import {unit} from './units.js';
import {Matrix4} from 'https://unpkg.com/three@0.118.3/build/three.module.js';


class ReferencePlane {
	constructor(M, orbit, phi=undefined, theta=undefined, psi=undefined) {
		/*
			@param M [Parameter] [kg]: mass of central body
			@param orbit [Orbit]: orbit which the center of this reference plane follows
			@param phi [Parameter] [deg]: obliquity
			@param theta [Parameter] [deg]: some angle or something
			@param psi [Parameter] [deg]: some other angle or something
		*/
		this.M = Parameter.makeParameter(M, 'kg');
		this.orbit = orbit;
		if (phi === undefined) {
			this.phi = this.orbit.Omega;
		} else {
			this.phi = Parameter.makeParameter(phi, 'deg');
		}
		if (theta === undefined) {
			this.theta = this.orbit.i;
		} else {
			this.theta = Parameter.makeParameter(theta, 'deg');
		}
		if (psi === undefined) {
			this.psi = this.orbit.omega;
		} else {
			this.psi = Parameter.makeParameter(psi, 'deg');
		}

		this.angleFixed = this.orbit.ref.angleFixed && this.phi.isStatic && this.theta.isStatic && this.psi.isStatic;
		this.positionFixed = this.orbit instanceof NullOrbit;
		this.isStatic = this.angleFixed && this.positionFixed;

		if (this.angleFixed) {
			this.rotationMatrix = this.getRotationMatrix(0);
		} // Don't do this for translation because it is easy to calculate anyway and units might mess things up
	}

	get GM() { // Returns something in m³/s²
		return this.M.in('kg')*6.67408e-11;
	}

	position(t, timeStepUnit='ms', outputUnit='m') {
		return this.orbit.position(t, timeStepUnit, outputUnit)
	}

	getRotationMatrix(t, timeStepUnit='ms') {
		let angleZ0 = this.phi.at(t, timeStepUnit, 'rad');
		let angleX = this.theta.at(t, timeStepUnit, 'rad');
		let angleZ1 = this.psi.at(t, timeStepUnit, 'rad');

		let c1, c2, c3, s1, s2, s3;
		c1 = Math.cos(angleZ0);s1 = Math.sin(angleZ0);
		c2 = Math.cos(angleX);s2 = Math.sin(angleX);
		c3 = Math.cos(angleZ1);s3 = Math.sin(angleZ1);
		let m_rot = new Matrix4();
		m_rot.set( c1*c3-c2*s1*s3, -c1*s3-c2*c3*s1, s1*s2, 0,
			c3*s1+c1*c2*s3, c1*c2*c3-s1*s3, -c1*s2, 0,
			s2*s3, c3*s2, c2, 0,
			0,0,0,1);
		
		return m_rot
	}

	getTranslationMatrix(t, timeStepUnit='ms', outputUnit='AU') {
		let m_tr = new Matrix4();
		let pos = this.position(t, timeStepUnit, outputUnit);
		m_tr.makeTranslation(pos.x, pos.y, pos.z);

		return m_tr
	}

	getMatrix(t, timeStepUnit='ms', outputUnit='AU') {
		// Rotation
		let m_rot;
		if (this.rotationMatrix) {
			m_rot = this.rotationMatrix;
		} else {
			m_rot = this.getRotationMatrix(t, timeStepUnit);
		}

		// Translation
		let m_tr = this.getTranslationMatrix(t, timeStepUnit, outputUnit);

		return m_tr.multiply(m_rot).multiply(this.orbit.ref.getMatrix(t, timeStepUnit, outputUnit)); // "rot after tr after parent_referenceplane"
	}
}

class FreeReferencePlane {
	constructor(M=new Parameter(1, 'M☉'), x=new Parameter(0, 'm'), y=new Parameter(0, 'm'), z=new Parameter(0, 'm'), phi=new Parameter(0, 'rad'), theta=new Parameter(0, 'rad'), psi=new Parameter(0, 'rad')) {
		/*
			@param M [Parameter] [kg]: mass of central body
			@param x [Parameter] [m]: x coordinate of origin
			@param y [Parameter] [m]: y coordinate of origin
			@param z [Parameter] [m]: z cooridnate of origin
			@param phi [Parameter] [deg]: obliquity
			@param theta [Parameter] [deg]: some angle or something
			@param psi [Parameter] [deg]: some other angle or something
		*/
		this.M = Parameter.makeParameter(M, 'kg');
		this.x = Parameter.makeParameter(x, 'm');
		this.y = Parameter.makeParameter(y, 'm');
		this.z = Parameter.makeParameter(z, 'm');
		this.phi = Parameter.makeParameter(phi, 'deg');
		this.theta = Parameter.makeParameter(theta, 'deg');
		this.psi = Parameter.makeParameter(psi, 'deg');

		this.angleFixed = this.phi.isStatic && this.theta.isStatic && this.psi.isStatic;
		this.positionFixed = this.x.isStatic && this.y.isStatic && this.z.isStatic;
		this.isStatic = this.angleFixed && this.positionFixed;

		if (this.angleFixed) {
			this.rotationMatrix = this.getRotationMatrix(0);
		} // Don't do this for translation because it is easy to calculate anyway and units might mess things up
	}

	get GM() { // Returns something in m³/s²
		return this.M.in('kg')*6.67408e-11;
	}

	position(t, timeStepUnit='ms', outputUnit='m') {
		return {x:this.x.at(t, timeStepUnit, outputUnit), y:this.y.at(t, timeStepUnit, outputUnit), z:this.z.at(t, timeStepUnit, outputUnit)}
	}

	getRotationMatrix(t, timeStepUnit='ms') {
		let angleZ0 = this.phi.at(t, timeStepUnit, 'rad');
		let angleX = this.theta.at(t, timeStepUnit, 'rad');
		let angleZ1 = this.psi.at(t, timeStepUnit, 'rad');

		let c1, c2, c3, s1, s2, s3;
		c1 = Math.cos(angleZ0);s1 = Math.sin(angleZ0);
		c2 = Math.cos(angleX);s2 = Math.sin(angleX);
		c3 = Math.cos(angleZ1);s3 = Math.sin(angleZ1);
		let m_rot = new Matrix4();
		m_rot.set( c1*c3-c2*s1*s3, -c1*s3-c2*c3*s1, s1*s2, 0,
			c3*s1+c1*c2*s3, c1*c2*c3-s1*s3, -c1*s2, 0,
			s2*s3, c3*s2, c2, 0,
			0,0,0,1);
		
		return m_rot
	}

	getTranslationMatrix(t, timeStepUnit='ms', outputUnit='AU') {
		let m_tr = new Matrix4();
		let pos = this.position(t, timeStepUnit, outputUnit);
		m_tr.makeTranslation(pos.x, pos.y, pos.z);

		return m_tr
	}

	getMatrix(t, timeStepUnit='ms', outputUnit='AU') {
		// Rotation
		let m_rot;
		if (this.rotationMatrix) {
			m_rot = this.rotationMatrix;
		} else {
			m_rot = this.getRotationMatrix(t, timeStepUnit);
		}

		// Translation
		let m_tr = this.getTranslationMatrix(t, timeStepUnit, outputUnit);

		return m_tr.multiply(m_rot); // "rot after tr"
	}
}


class Orbit {
	constructor(ref, {Omega, i, e, omega, omegabar, a, q, n, M0, L0}={}) {
		/*
			If any orbital parameter is specified as a function of time,
			this time should be in MILLISECONDS SINCE JULIAN EPOCH
			@param ref [ReferencePlane]: Plane of reference for this orbit
			@param Omega [Parameter] [rad]: Longitude of ascending node
			@param i [Parameter] [rad]: Inclination to reference plane
			@param e [Parameter] [-]: Eccentricity
			@param <omega> [Parameter] [rad]: Argument of periapsis
			@param~ <omegabar> [Parameter] [rad]: Longitude of periapsis (= Omega + omega)
			@param <a> [Parameter] [m]: Semi-major axis
			@param~ <q> [Parameter] [m]: Distance of periapsis
			@param~ <n> [Parameter] [rad/s]: Mean motion
			@param <M0> [Parameter] [rad]: Mean anomaly at epoch
			@param~ <L0> [Parameter] [rad]: Longitude at epoch (= M0 + Omega + omega)
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

	position(t, timeStepUnit='ms', outputUnit='m') {
		/*
			t : timestamp (in milliseconds) since Javascript epoch (i.e. 1970)
			return : {x:, y:, z:}
		*/
	   
		if (!t) {
			t = Date.now()
		}

		//// Step 1: get delta_t
		let epoch = new Date(2000, 0, 1, 11, 58, 55, 816); // January 1, 2000, 11:58:55.816 UTC
		let delta_t = unit(t, timeStepUnit, 'ms') - epoch.getTime(); // Milliseconds from epoch to t

		// Get all 'this.' orbit parameters at time delta_t into local variables
		let Omega = this.Omega.at(delta_t, 'ms', 'rad');
		let i = this.i.at(delta_t, 'ms', 'rad');
		let e = this.e.at(delta_t, 'ms');
		let omega = this.omega.at(delta_t, 'ms', 'rad');
		let a = this.a.at(delta_t, 'ms', outputUnit);
		let M0 = this.M0.at(delta_t, 'ms', 'rad');
		
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
		let z = 0;

		//// Step 4: multiply coordinate with matrices in order to rotate elliptic orbit into correct position
		// TODO: Could maybe precalculate cosines and sines, but they are only used twice so the performance increase might be negligible?
		// Rotate point by argument of periapsis around z-axis
		let temp = x;
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

		// Tadaa, we have the actual x,y,z coordinate in our parent reference frame!
		return {x:x, y:y, z:z}
	}

	position_abs(t, timeStepUnit='ms', outputUnit='m') {
		let m = this.ref.getMatrix(t, timeStepUnit, outputUnit).elements;
		let pos = this.position(t, timeStepUnit, outputUnit);
		let x = m[0]*pos.x + m[4]*pos.y + m[8]*pos.z + m[12];
		let y = m[1]*pos.x + m[5]*pos.y + m[7]*pos.z + m[13];
		let z = m[2]*pos.x + m[6]*pos.y + m[10]*pos.z + m[14];
		return {x:x, y:y, z:z}
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
	constructor(name, type, orbit, {graphics, rotation}={}) {
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
		if (rotation) {
			this.rotation = rotation;
		} else {
			this.rotation = new Rotation(this.orbit.ref, 0, 90, new Parameter([0, 1], 'rad', 'day'));
		}

		// Add this to this type
		this.type = type || '';
		if (Orbiter.types[this.type]) { // If there already exists an object of the same type
			Orbiter.types[this.type].push(this);
		} else { // If this is the first object of this type
			Orbiter.types[this.type] = [this];
		}
	}

	position(t, timeStepUnit='ms', outputUnit='m') {
		return this.orbit.position_abs(t, timeStepUnit, outputUnit);
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

	in(outputUnit) { // TODO: Should remove this function since it is better to just convertUnit
		if (this.isStatic) {
			return unit(this.val, this.unit, outputUnit);
		} else {
			throw `Can not use Parameter.in('${outputUnit}'): this parameter is time-dependent. Use Parameter.convertUnit instead.`
		}
	}

	convertUnit(to, timeStepUnit=this.timeStepUnit) {
		let spaceConv = unit(1, this.unit, to);
		let timeConv = unit(1, timeStepUnit, this.timeStepUnit);
		let newArray = this.array.map((x,i) => x*spaceConv*timeConv**i);
		return new Parameter(newArray, to, timeStepUnit)
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

	get isStatic() {
		return this.length == 1;
	}
}
Parameter.makeParameter = function(thing, defaultUnit, defaultTimeStepUnit='ms') {
	if (thing instanceof Parameter) {
		return thing
	} else {
		return new Parameter(thing, defaultUnit, defaultTimeStepUnit)
	}
}

class Graphics { // TODO: still need a better way of incorporating THREE in this
	constructor(color, radius, {textureFile}={}) {
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

		this.hasTexture = false;
		if (textureFile) {
			this.textureFile = textureFile;
			this.hasTexture = true;
		}
	}

	set mesh(threeMesh) {
		this.threeMesh = threeMesh;
		this.isThree = true;
	}

	get mesh() {
		if (this.isThree) {
			return this.threeMesh
		} else {
			throw `Tried to access mesh, but this object does not have a mesh.`
		}
	}
	get geometry() {
		if (this.isThree) {
			return this.threeMesh.geometry
		} else {
			throw `Tried to access geometry, but this object is not a three.js object.`
		}
	}
	get material() {
		if (this.isThree) {
			return this.threeMesh.material
		} else {
			throw `Tried to access material, but this object is not a three.js object.`
		}
	}
}

class Rotation {
	constructor(ref, RA, dec, r) {
		/*
			If any orbital parameter is specified as a function of time,
			this time should be in MILLISECONDS SINCE JULIAN EPOCH
			@param ref [ReferencePlane]: Plane of reference for the positive pole of the axis
			@param RA [Parameter] [deg]: Right ascension of the rotational axis w.r.t. ref
			@param dec [Parameter] [deg]: Declination of the rotational axis w.r.t. ref
			@param r [Parameter] [deg/day]: Rotation at a time t (zeroth order is rotation at epoch, first order is rotation speed)
		*/
		this.ref = ref;
		this.RA = Parameter.makeParameter(RA, 'deg', 'ms');
		this.dec = Parameter.makeParameter(dec, 'deg', 'ms');
		this.r = Parameter.makeParameter(r, 'deg', 'day');
		this.angleFixed = this.ref.angleFixed && this.RA.isStatic && this.dec.isStatic && this.r.isStatic;

		this.axisRotationMatrix = new Matrix4();

		if (this.angleFixed) { // Means all the parent referenceplanes have a fixed angle as well
			this.rotationMatrix = 0;
		} else {
			// math if the reference plane changes
		}
	}

	getRotationMatrix(t, timeStepUnit='ms') {
		// let rotation axis be X axis (X+ = north) => rotate around Z (RA) -> rotate around Y (dec) -> rotate around X (r)
		let angleZ0 = this.RA.at(t, timeStepUnit, 'rad');
		let angleX = this.theta.at(t, timeStepUnit, 'rad');
		let angleZ1 = this.psi.at(t, timeStepUnit, 'rad');

		let c1, c2, c3, s1, s2, s3;
		c1 = Math.cos(angleZ0);s1 = Math.sin(angleZ0);
		c2 = Math.cos(angleX);s2 = Math.sin(angleX);
		c3 = Math.cos(angleZ1);s3 = Math.sin(angleZ1);
		let m_rot = new Matrix4();
		m_rot.set( c1*c3-c2*s1*s3, -c1*s3-c2*c3*s1, s1*s2, 0,
			c3*s1+c1*c2*s3, c1*c2*c3-s1*s3, -c1*s2, 0,
			s2*s3, c3*s2, c2, 0,
			0,0,0,1);
		
		return m_rot
	}

	getMatrix(t, timeStepUnit='ms', outputUnit='AU') {
		// Rotation
		let m_rot;
		if (this.rotationMatrix) {
			m_rot = this.rotationMatrix;
		} else {
			m_rot = this.getRotationMatrix(t, timeStepUnit);
		}

		// Translation
		let m_tr = this.getTranslationMatrix(t, timeStepUnit, outputUnit);

		return m_rot.multiply(this.ref.getMatrix(t, timeStepUnit, outputUnit)); // "rot after tr"
	}
}

export {ReferencePlane, FreeReferencePlane, Orbit, NullOrbit, Orbiter, Parameter, Graphics, Rotation}
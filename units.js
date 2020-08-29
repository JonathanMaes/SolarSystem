function unit(n, from, to) {
	// console.log(`${n}, ${from}, ${to}`);
	if (from == to) {
		return n // This is what stops the recursion
	}
	switch (from) {
		case 'm': case 'rad': case 's': case 'kg': // These are fundamental units, so just convert the units now
			return n/unit(1, to, from) // unit(n, to, from) yields the conversion coefficient

		case '': // There is no unit
			return n

		case 'AU':
			return unit(n*149597870700, 'm', to || 'm')
		case 'km':
			return unit(n*1000, 'm', to || 'm')
		case 'pc':
            return unit(n*648000/Math.PI, 'AU', to || 'm')
        case 'ly':
            return unit(n*9460730472580800, 'm', to || 'm')

		case 'deg':
			return unit(n/180*Math.PI, 'rad', to || 'rad')
		case 'arcsec': case 'as': case '"':
			return unit(n/3600, 'deg', to || 'deg')

		case 'ms':
			return unit(n/1000, 's', to || 's')
		case 'hour': case 'hours': case 'h':
			return unit(n*3600, 's', to || 's')
		case 'day': case 'days': case 'D':
			return unit(n*86400, 's', to || 's')
		case 'year': case 'years':
			return unit(n*31557600, 's', to || 's')
		case 'century': case 'centuries': case 'Cy':
			return unit(n*3155760000, 's', to || 's')
		
		case 'M☉': case 'Msun':
			return unit(n*1.98847e30, 'kg', to || 'kg')
		case 'M⊕': case 'Mearth':
			return unit(n*5.9722e24, 'kg', to || 'kg')

		default:
			throw `Unit '${from}' unknown.`
			return undefined // If 'from' is not a known unit
	}
}

export {unit}
const calculatePrice = (persons, hours) => {
    let pricePerHour

    switch (persons) {
        case 1: pricePerHour = 50; break
        case 2: pricePerHour = 60; break
        case 3: pricePerHour = 75; break
        case 4: pricePerHour = 80; break
        default: pricePerHour = persons * 20; break
    }

    return pricePerHour * hours
}

module.exports = { calculatePrice }
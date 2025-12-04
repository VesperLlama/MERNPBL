class Flight {
  constructor(flightNumber, carrierName, source, destination, departureTime, arrivalTime, price, seats) {
    this.flightNumber = flightNumber;
    this.carrierName = carrierName;
    this.source = source;
    this.destination = destination;
    this.departureTime = departureTime;
    this.arrivalTime = arrivalTime;
    this.price = price;
    this.seats = seats;
  }
}

module.exports = Flight;

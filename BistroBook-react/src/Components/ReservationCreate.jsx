import { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ReservationCreate({refreash}) {

    const [step, setStep] = useState(1);
    const [date, setDate] = useState('');
    const [guestCount, setGuestCount] = useState(0);
    const [tableId, setTableId] = useState(0);
    const [startTime, setStartTime] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [error, setError] = useState('');
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const handleNextStep = () => {
        if (step === 1 && !date) {
            alert("Please select a date.");
            return;
        }
        if (step === 2 && (!guestCount || guestCount < 1 || guestCount > 8)) {
            alert("Please pick a valid number of guests (1-8).");
            return;
        }
        if (step === 3 && !tableId) {
            alert("Please select a table.");
            return;
        }
        if (step === 4 && !startTime) {
            alert("Please select a start time.");
            return;
        }

        if (step === 5 && (!firstName || !lastName || !phoneNumber || !email)) {
            alert("Please fill in all fields.");
            return;
        }

        const phoneRegex = /^\d{7,}$/; // Regex for at least 7 digits
        if (step === 5 && !phoneRegex.test(phoneNumber)) {
            alert("Phone number must contain at least 7 digits and can only be numbers.");
            return;
        }
        
        if (step === 6 && (!date || !guestCount || !tableId || !startTime || !firstName || !lastName || !phoneNumber || !email)) {
            alert("Please ensure all booking information is complete.");
            return;
        }
        setStep(step + 1);
    };

    // Search for available tables based on the number of guests
    const handlesearchTables = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`https://localhost:7042/api/Tables/GetAvailableTables/${guestCount}`);
            setAvailableTables(response.data);
            console.log(response)
        } catch (error) {
            console.error("Error fetching available tables", error);
            setError('Error fetching available tables! Please try again.');
        }
    };

    // Handle table selection and fetch available times
    const handleTableSelect = async (tableId) => {
        setTableId(tableId); // Update the selected table ID first

        // Fetch the available times only after setting the table ID
        await handleFetchAvailableTimes(tableId);
    };

    // Fetch available times for a specific table on the selected date
    const handleFetchAvailableTimes = async (tableId) => {
        if (!date || !tableId) {
            return;
        }

        try {
            const response = await axios.get(`https://localhost:7042/api/Reservations/GetReservationsByTableIdAndDate/${tableId}/${date}`);
            setAvailableTimes(response.data);
            console.log(response);
        } catch (error) {
            console.error("Error fetching available times", error);
            setError('Error fetching available times! Please try again.');
        }
    };

    // Handle reservation submission
    async function handleSubmit(e) {
        e.preventDefault();
        const reservation = {
            tableId,
            firstName,
            lastName,
            phoneNumber,
            email,
            guestCount,
            date,
            startTime: `${startTime}:00` // Convert startTime to proper format
        };

        try {
            await axios.post('https://localhost:7042/api/Reservations/AddReservation', reservation);
            alert('Reservation created successfully');
            setBookingConfirmed(true);
            // Clear form states if necessary
        } catch (error) {
            console.error(error);
            setError('Error creating reservation');
        }
    }

    // Create time slots
    const createTimeSlots = () => {
        const times = [];
        for (let hour = 10; hour <= 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 20 && minute > 0) break;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                times.push(time);
            }
        }
        return times;
    };

    // Get the booked times and ensure each time slot has 2 hours of free slots
    const getBookedTimes = () => {
        const slots = createTimeSlots();
        const bookedTimes = availableTimes.map((reservation) => 
            reservation.startTime.split(':')[0] + ':' + reservation.startTime.split(':')[1]
        );

        return slots.map((time, index) => {
            // Check if this time or any of the next 3 slots are booked (2 hours total)
            const isBooked = bookedTimes.includes(time) || 
                // Check next three slots (the two-hour buffer after)
                [1, 2, 3].some(offset => slots[index + offset] && bookedTimes.includes(slots[index + offset])) ||
                // Check previous three slots (the two-hour buffer before)
                [-1, -2, -3].some(offset => slots[index + offset] && bookedTimes.includes(slots[index + offset]));
            
            return {
                time,
                isBooked,
            };
        });
    };

    return (
        <div className="container mt-5">
            <h2 className="fixed-top bg-light p-3">Create a Reservation</h2> {/* Fixed header */}
    
            <div className="step-content mt-5 pt-5"> {/* Add padding to avoid overlap */}
                {step === 1 && (
                    <>
                        <h4>- Pick a Date -</h4>
                        <input
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <button 
                            onClick={handleNextStep} 
                            className="btn btn-outline-primary mt-3"
                        >
                            Next
                        </button>
                    </>
                )}

                    
                {step === 2 && (
                    <>
                        <h4>- Pick Guest Amount -</h4>
                        <ul className="list-group">
                            {[...Array(8)].map((_, index) => {
                                const guestCountValue = index + 1;
                                return (
                                    <li 
                                        key={index} 
                                        className={`list-group-item d-flex justify-content-between align-items-center ${guestCount === guestCountValue ? 'bg-light text-dark' : ''}`} 
                                        onClick={() => setGuestCount(guestCountValue)} 
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {guestCountValue} Guests
                                        {guestCount === guestCountValue && <span className="badge bg-primary">Selected</span>}
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="d-flex justify-content-between mt-4">
                            <button 
                                onClick={() => {
                                    setStep(step - 1); 
                                    setGuestCount(0);
                                }} 
                                className="btn btn-outline-secondary"
                            >
                                Back
                            </button>
                            <button 
                                onClick={(e) => { handlesearchTables(e); handleNextStep(); }} 
                                className="btn btn-outline-primary"
                                disabled={guestCount < 1}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}


                    
                {step === 3 && (
                    <>
                        <h4>- Available Tables -</h4>
                        {availableTables.length > 0 ? (
                            <ul className="list-group">
                                {availableTables.map((table) => (
                                    <li 
                                        key={table.id} 
                                        className={`list-group-item d-flex justify-content-between align-items-center ${tableId === table.id ? 'bg-light text-dark' : ''}`} 
                                        onClick={() => handleTableSelect(table.id)} 
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Table {table.tableNumber}
                                        {tableId === table.id && <span className="badge bg-primary">Selected</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No available tables for {guestCount} guests.</p>
                        )}

                        <div className="d-flex justify-content-between mt-4">
                            <button
                                onClick={() => {
                                    setStep(step - 1); 
                                    setTableId(0);
                                }}
                                className="btn btn-outline-secondary"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleNextStep} 
                                className="btn btn-outline-primary"
                                disabled={!tableId}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}



                    
                {step === 4 && (
                    <>
                        <h4>- Select Your Start Time -</h4>
                        <p>Your reservation will be valid for up to two hours following the selected start time.</p>

                        {getBookedTimes().every(({ isBooked }) => isBooked) ? (
                            // Display this message if all times are booked
                            <div className="alert alert-warning" role="alert">
                                Sorry, there are no available times. Please go back and try selecting a different table.
                            </div>
                        ) : (
                            <ul className="list-group">
                                {getBookedTimes()
                                    .filter(({ isBooked }) => !isBooked)
                                    .map(({ time }) => (
                                        <li 
                                            key={time} 
                                            className={`list-group-item d-flex justify-content-between align-items-center ${startTime === time ? 'bg-light text-dark' : ''}`} 
                                            onClick={() => setStartTime(time)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {time}
                                            {startTime === time && <span className="badge bg-primary">Selected</span>}
                                        </li>
                                    ))}
                            </ul>
                        )}

                            <div className="d-flex justify-content-between mt-4">
                                <button 
                                    onClick={() => {
                                        setStep(step - 1); 
                                        setStartTime('');
                                    }}
                                    className="btn btn-outline-secondary d-flex align-items-center"
                                >
                                    <i className="fas fa-arrow-left me-2"></i> Back
                                </button>
                                
                                <button 
                                    onClick={handleNextStep} 
                                    className="btn btn-outline-primary d-flex align-items-center"
                                    disabled={!startTime || getBookedTimes().every(({ isBooked }) => isBooked)}
                                >
                                    Next <i className="fas fa-arrow-right ms-2"></i>
                                </button>
                            </div>
                    </>
                )}



                    
                {step === 5 && (
                    <>
                        <h4>- Fill in Your Information -</h4>
                        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="row g-3 mt-4">
                            <div className="col-md-6">
                                <label htmlFor="firstName" className="form-label">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    className="form-control"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    className="form-control"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    className="form-control"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-12 d-flex justify-content-between mt-4">
                                <button 
                                    onClick={() => {
                                        setStep(step - 1); 
                                        setFirstName('');
                                        setLastName('');
                                        setPhoneNumber('');
                                        setEmail('');
                                    }}
                                    className="btn btn-outline-secondary"
                                >
                                    <i className="fas fa-arrow-left me-2"></i> Back
                                </button>
                                
                                <button 
                                    type="submit" 
                                    className="btn btn-outline-primary"
                                >
                                    Next <i className="fas fa-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </form>
                    </>
                )}


                    
                {step === 6 && (
                    <>
                        <h4>Booking Preview</h4>
                        <p><strong>Date:</strong> {date}</p>
                        <p><strong>Guests:</strong> {guestCount}</p>
                        <p><strong>Table:</strong> {availableTables.find((table) => table.id === tableId)?.tableNumber} - Seats: {availableTables.find((table) => table.id === tableId)?.seatCount}</p>
                        <p><strong>Reservation:</strong> {startTime}</p>
                        <p><strong>First Name:</strong> {firstName}</p>
                        <p><strong>Last Name:</strong> {lastName}</p>
                        <p><strong>Phone Number:</strong> {phoneNumber}</p>
                        <p><strong>Email:</strong> {email}</p>

                        <div className="d-flex justify-content-between mt-4">
                            <button 
                                onClick={() => setStep(step - 1)}
                                className="btn btn-outline-secondary"
                            >
                                <i className="fas fa-arrow-left me-2"></i> Back
                            </button>

                            <button 
                                onClick={(e) => { 
                                    handleSubmit(e);
                                    handleNextStep()
                                }} 
                                className="btn btn-outline-success"
                            >
                                Confirm <i className="fas fa-check ms-2"></i>
                            </button>
                        </div>
                    </>
                )}


                    
                {step === 7 && bookingConfirmed && (
                    <>
                        <h4>Booking Confirmed!</h4>
                        <p>Your reservation has been successfully completed.</p>
                        <div className="d-flex justify-content-between mt-3">
                            <button 
                                onClick={() => {
                                    window.location.href = "https://localhost:7013/"; // Redirect to the MVC Landing Page
                                }} 
                                className="btn btn-outline-primary"
                            >
                                Home
                            </button>
                            <button 
                                onClick={() => {
                                    refreash();
                                }} 
                                className="btn btn-outline-primary ms-2"
                            >
                                New Reservation
                            </button>
                        </div>
                    </>
                )}

                {error && <div className="alert alert-danger mt-4">{error}</div>}
            </div>
        </div>
    );
    
    
}

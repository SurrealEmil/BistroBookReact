import './App.css'
import ReservationCreate from './Components/ReservationCreate'

function App() {

  function handlePageRefreash(){
    window.location.reload()
  }

  return (
    <>
      <ReservationCreate refreash={handlePageRefreash}/>
    </>
  )
}

export default App

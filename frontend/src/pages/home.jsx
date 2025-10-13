import React from 'react'
import SelectionIcons from './components/SelectionIcons'
import IntroContent from './components/IntroContent'
import Header from './components/Header'
import { Link } from 'react-router-dom'

function Home() {
  return (
  <>
  <Header />
    <div className='App'>
      <SelectionIcons />
      <IntroContent />
    </div>
  </>
  );
}

export default Home

import React from 'react'
import SelectionIcons from './components/SelectionIcons'
import IntroContent from './components/IntroContent'
import { Link } from 'react-router-dom'

function Home() {
  return (
  <>
    <div className='App'>
      <SelectionIcons />
      <IntroContent />
    </div>
  </>
  );
}

export default Home

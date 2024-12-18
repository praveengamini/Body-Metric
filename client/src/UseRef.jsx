import React from 'react'
import { useState,useRef,useEffect } from 'react'
const UseRef = () => {
 const [count, setCount] = useState(0);
 const [content,setContent]= useState('');
 const count1 = useRef(0);
 useEffect(()=>{
    setCount(count+1);
 },[])
 useEffect(()=>{
    count1.current = count1.current + 1;
 },)
 
  return (
    <div >
      <input type="text" className=' border border-orange-800'
      onChange={(event)=>setContent(event.target.value)}
      />
      <h1>{content}</h1>
      <h1>{count}</h1>
      <h1>{count1.current}</h1>
    </div>
  )
}

export default UseRef

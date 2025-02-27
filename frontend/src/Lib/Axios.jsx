import axios from 'axios'
import React from 'react'

const Axios = axios.create({
    baseURL: "http://localhost:4000/api",
    withCredentials: true,
    timeout: 5000,
    headers: {
        "Content-Type": "application/json"
    }
})

export default Axios
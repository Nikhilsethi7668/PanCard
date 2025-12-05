import axios from 'axios'
import React from 'react'

const Axios = axios.create({
    baseURL: "http://66.94.120.78:4001/api",
    withCredentials: true,
    timeout: 100000,
    headers: {
        "Content-Type": "application/json"
    }
})

export default Axios
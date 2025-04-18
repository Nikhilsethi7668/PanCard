import axios from 'axios'
import React from 'react'

const Axios = axios.create({
    baseURL: "https://panemail-api.amiigo.in/api",
    withCredentials: true,
    timeout: 100000,
    headers: {
        "Content-Type": "application/json"
    }
})

export default Axios
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const filePath = path.join(__dirname, 'public/images/productos/test-image.jpg');
const url = 'http://localhost:3000/api/admin/uploads/github-upload';

async function uploadImage() {
  try {
    console.log('Preparando el archivo para subir:', filePath);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log('Enviando solicitud al servidor...');

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('Respuesta del servidor:', response.data);
  } catch (error) {
    console.error('Error al subir la imagen:', error.response?.data || error.message);
    console.error('Detalles del error:', error);
  }
}

uploadImage();
const fs = require('fs');

async function uploadImage() {
    const cloudName = 'dkfxbq1g';
    const uploadPreset = 'luxe_gallery_upload';

    // Read local file
    const fileBuffer = fs.readFileSync('./images/art1.png');

    // Create a Blob from the buffer (Node 18+ FormData supports Blobs)
    const blob = new Blob([fileBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'art1.png');
    formData.append('upload_preset', uploadPreset);

    try {
        console.log("Sending request to Cloudinary...");
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

uploadImage();

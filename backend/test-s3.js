require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const https = require('https');

async function testS3() {
    console.log("Testing S3 Configuration...");

    const s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    const bucketParams = {
        Bucket: process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET,
    };

    if (!bucketParams.Bucket) {
        console.error("❌ Bucket name is not defined in .env");
        return;
    }

    console.log(`Bucket: ${bucketParams.Bucket}`);
    console.log(`Region: ${process.env.AWS_REGION || 'ap-south-1'}`);

    const testFileName = `test-upload-${Date.now()}.txt`;
    console.log(`\n1. Attempting to upload file: ${testFileName}`);

    try {
        const uploadParams = {
            ...bucketParams,
            Key: `attachments/${testFileName}`,
            Body: "This is a test file to verify S3 uploads are working.",
            ContentType: "text/plain",
            // Un-comment to test ACL if bucket supports it
            // ACL: 'public-read'
        };

        await s3.send(new PutObjectCommand(uploadParams));
        console.log("✅ Upload successful!");

        // Construct the public URL
        // Format: https://[bucket-name].s3.[region].amazonaws.com/[key]
        const region = process.env.AWS_REGION || 'ap-south-1';
        let publicUrl;

        // Sometimes region is implicitly us-east-1 in old buckets, but standard format is:
        if (region === 'us-east-1') {
            publicUrl = `https://${bucketParams.Bucket}.s3.amazonaws.com/attachments/${testFileName}`;
        } else {
            publicUrl = `https://${bucketParams.Bucket}.s3.${region}.amazonaws.com/attachments/${testFileName}`;
        }

        console.log(`\n2. Attempting to retrieve file from public URL...`);
        console.log(`URL: ${publicUrl}`);

        https.get(publicUrl, (res) => {
            console.log(`HTTP Status Code: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log("✅ File is successfully publicly readable!");
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => console.log(`File Content: "${data}"`));
            } else if (res.statusCode === 403) {
                console.error("❌ Access Denied (403). The file is successfully stored in S3, BUT the bucket is not publicly readable.");
                console.log("👉 Go to AWS S3 Console -> Bucket -> Permissions -> Turn off 'Block all public access'");
                console.log("👉 And add a Bucket Policy to allow public read access.");
            } else {
                console.error(`❌ Failed to read file. Status: ${res.statusCode}`);
            }
        }).on('error', (e) => {
            console.error(`Error fetching URL: ${e.message}`);
        });

    } catch (err) {
        console.error("❌ Upload failed:", err.message);
        if (err.name === 'InvalidAccessKeyId') {
            console.error("The AWS Access Key in your .env is invalid.");
        } else if (err.name === 'SignatureDoesNotMatch') {
            console.error("The AWS Secret Key in your .env is invalid.");
        }
    }
}

testS3();

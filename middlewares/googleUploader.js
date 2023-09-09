const stream = require('stream')
const { google } = require('googleapis');
const ApiError = require('./errorHandler');

const CIENT_ID = process.env.GOOGLE_CLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLOUD_CIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_CLOUD_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_COLUD_REFRESH_TOKEN;

const STORAGE_FOLDER_ID = process.env.IMAGE_DRIVE_FOLDER_ID

const oauth2Client = new google.auth.OAuth2(CIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

const drive = google.drive({ version: 'v3', auth: oauth2Client })

const encodeFileName = (fileName) => {
    const fileExtensionIndex = fileName.lastIndexOf(".");
    const encodeName = fileName.slice(0, fileExtensionIndex) 
        + "_" + Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)
        + "_" + (new Date().getTime())
        + fileName.slice(fileExtensionIndex);

    return encodeName
}

const uploadGGDrive = async (file) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);
    
    const newFileName = await encodeFileName(file.originalname); // Encode tên file
   
    const resultUploaded = await drive.files.create({ // Upload 1 file lên GG Drive
        requestBody: {
            name: newFileName,
            mimeType: file.mimetype,
            parents: [STORAGE_FOLDER_ID]
        },
        media: {
            mimeType: file.mimetype,
            body: bufferStream
        },
        fields: 'id'
    })
    
    await drive.permissions.create({ // Cấp quyền public
        fileId: resultUploaded.data.id,
        requestBody: { role: 'reader', type: 'anyone' }
    })
    
    const fileData = await drive.files.get({ // Tạo public link và fileID
        fileId: resultUploaded.data.id,
        fields: 'webContentLink'
    })
    const webContentLink = fileData.data.webContentLink;

    return {
        field: file.fieldname,
        fileId: resultUploaded.data.id,
        fileUrl: webContentLink.slice(0, webContentLink.indexOf('&export=download'))
    };
};

exports.uploadFile = async (req, res, next) => {
    try {
        if (req.file) {
            const uploadedData = await uploadGGDrive(req.file);
            req.file = uploadedData;
        } 
        else if (req.files && Array.isArray(req.files)) {
            await Promise.all(req.files.map(file => uploadGGDrive(file)))
                .then((res) => {
                    req.files = res;
                })
                .catch(() => {
                    return new ApiError(500, "Server could not process the request")
                })
        } 
        else if (req.files && typeof req.files === 'object') {
            var arrFiles = []
            Object.keys(req.files).map(key => {
                req.files[key].forEach(file => {
                    arrFiles.push(file)
                })
            })

            await Promise.all(arrFiles.map(file => uploadGGDrive(file)))
                .then((res) => {
                    req.files = res;
                })
                .catch(() => {
                    return new ApiError(500, "Server could not process the request")
                })
        }  

        return next();
    } catch (error) {
        return new ApiError(500, "Server could not process the request")
    }
}

exports.deleteFile = async (fileId) => {
    try {
        await drive.files.delete({ fileId: fileId })
    } catch (error) {}
};
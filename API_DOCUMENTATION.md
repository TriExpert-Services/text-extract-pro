# 📡 TextExtract Pro - API Documentation

## 🌟 Overview

TextExtract Pro provides a complete REST API for integrating text extraction capabilities into your applications. The API is built using Supabase Edge Functions and supports high-performance text extraction from images and documents.

## 🔑 Authentication

All API requests require authentication. You can use either:

1. **User Authentication**: Include user session token
2. **API Key**: Include API key in headers (for service-to-service communication)

### Headers
```
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
Content-Type: application/json
x-api-key: YOUR_API_KEY (optional)
```

## 🚀 Base URL

```
Production: https://supabase.n8n-tech.cloud/functions/v1
```

## 📋 Endpoints

### 1. Extract Text from Files

**POST** `/extract-text`

Extract text from uploaded files using AI-powered OCR.

#### Request Body
```json
{
  "file_data": "base64_encoded_file_content",
  "file_name": "document.jpg",
  "file_type": "image/jpeg",
  "openai_api_key": "sk-your-key-here",
  "user_id": "user-uuid-here",
  "enhance_text": false
}
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_data` | string | Yes | Base64 encoded file content |
| `file_name` | string | Yes | Original filename |
| `file_type` | string | Yes | MIME type (e.g., image/jpeg, application/pdf) |
| `openai_api_key` | string | Yes* | OpenAI API key (*required for images) |
| `user_id` | string | No | User ID to save extraction to database |
| `enhance_text` | boolean | No | Whether to enhance extracted text with AI |

#### Response
```json
{
  "success": true,
  "data": {
    "extracted_text": "This is the extracted text...",
    "confidence_score": 0.95,
    "processing_time": 1250,
    "file_name": "document.jpg",
    "extraction_id": "uuid-here"
  }
}
```

#### Example cURL
```bash
curl -X POST "https://supabase.n8n-tech.cloud/functions/v1/extract-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "file_data": "iVBORw0KGgoAAAANSUhEUgAA...",
    "file_name": "receipt.jpg",
    "file_type": "image/jpeg",
    "openai_api_key": "sk-your-key-here",
    "user_id": "user-123",
    "enhance_text": true
  }'
```

### 2. Get User Extractions

**GET/POST** `/get-extractions`

Retrieve user's extraction history with filtering and pagination.

#### GET Parameters
```
GET /get-extractions?user_id=uuid&limit=10&offset=0&search=receipt&file_type=image
```

#### POST Request Body
```json
{
  "user_id": "user-uuid-here",
  "limit": 10,
  "offset": 0,
  "search": "receipt",
  "file_type": "image"
}
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | User UUID |
| `limit` | number | No | Number of results (default: 10) |
| `offset` | number | No | Pagination offset (default: 0) |
| `search` | string | No | Search in filename and extracted text |
| `file_type` | string | No | Filter by file type (image, application, text) |

#### Response
```json
{
  "success": true,
  "data": {
    "extractions": [
      {
        "id": "extraction-uuid",
        "file_name": "receipt.jpg",
        "extracted_text": "Store Receipt...",
        "confidence_score": 0.95,
        "processing_time": 1250,
        "created_at": "2024-01-15T10:30:00Z",
        "file_type": "image/jpeg",
        "file_size": 1024000
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

### 3. Get User Analytics

**GET/POST** `/get-analytics`

Retrieve comprehensive analytics for a user.

#### GET Parameters
```
GET /get-analytics?user_id=uuid&start=2024-01-01&end=2024-01-31
```

#### POST Request Body
```json
{
  "user_id": "user-uuid-here",
  "date_range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user_analytics": {
      "total_extractions": 150,
      "total_files_processed": 150,
      "total_text_extracted": 50000,
      "average_confidence": 0.89
    },
    "daily_extractions": [
      {
        "date": "2024-01-15",
        "extractions": 5
      }
    ],
    "file_type_distribution": [
      {
        "type": "Image",
        "count": 120,
        "color": "#3B82F6"
      }
    ],
    "confidence_distribution": [
      {
        "range": "High (80-100%)",
        "count": 100
      }
    ]
  }
}
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## 🔧 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid authentication |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

## 📝 Examples

### JavaScript/Node.js
```javascript
const extractText = async (fileBase64, fileName, fileType, apiKey) => {
  const response = await fetch('https://supabase.n8n-tech.cloud/functions/v1/extract-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      file_data: fileBase64,
      file_name: fileName,
      file_type: fileType,
      openai_api_key: apiKey,
      user_id: 'user-123',
      enhance_text: true
    })
  })
  
  const result = await response.json()
  return result
}
```

### Python
```python
import requests
import base64

def extract_text(file_path, openai_key, user_token):
    with open(file_path, 'rb') as file:
        file_data = base64.b64encode(file.read()).decode('utf-8')
    
    response = requests.post(
        'https://supabase.n8n-tech.cloud/functions/v1/extract-text',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {user_token}'
        },
        json={
            'file_data': file_data,
            'file_name': 'document.jpg',
            'file_type': 'image/jpeg',
            'openai_api_key': openai_key,
            'user_id': 'user-123',
            'enhance_text': True
        }
    )
    
    return response.json()
```

### PHP
```php
function extractText($fileBase64, $fileName, $fileType, $apiKey, $userToken) {
    $data = [
        'file_data' => $fileBase64,
        'file_name' => $fileName,
        'file_type' => $fileType,
        'openai_api_key' => $apiKey,
        'user_id' => 'user-123',
        'enhance_text' => true
    ];

    $options = [
        'http' => [
            'header' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $userToken
            ],
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];

    $context = stream_context_create($options);
    $result = file_get_contents(
        'https://supabase.n8n-tech.cloud/functions/v1/extract-text',
        false,
        $context
    );

    return json_decode($result, true);
}
```

## 🚦 Rate Limits

- **Rate Limit**: 100 requests per minute per user
- **File Size Limit**: 10MB per file
- **Concurrent Requests**: 5 simultaneous requests per user

## 🔒 Security

- All requests must be made over HTTPS
- API keys should be kept secure and rotated regularly
- File uploads are validated and sanitized
- All data is encrypted in transit and at rest

## 🆘 Error Handling

Always check the `success` field in the response:

```javascript
const result = await extractText(fileData, fileName, fileType, apiKey)

if (result.success) {
  console.log('Extracted text:', result.data.extracted_text)
} else {
  console.error('Error:', result.error)
}
```

## 📞 Support

For API support and questions:
- Email: api-support@textextract-pro.com
- Documentation: https://docs.textextract-pro.com
- Status Page: https://status.textextract-pro.com

## 🔄 Changelog

### Version 1.0.0
- Initial API release
- Text extraction from images
- User analytics endpoints
- Extraction history management
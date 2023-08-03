# upload-demo

This control flow of my proposed upload demo. The required environment variable is in `config.ts`

|                       |                        |
| --------------------- | ---------------------- |
| AWS_ACCESS_KEY_ID     | Access key ID          |
| AWS_SECRET_ACCESS_KEY | Access token           |
| ENDPOINT              | S3-compatible endpoint |
| BUCKET_NAME           | Bucket name            |
| REGION                | Server region name     |

The storage can be any S3-compatible service.

## Add new submission

### POST /add_submission

```bash
$ curl -X POST 'http://localhost:8881/add_submission?user_id=1000&task_id=1'
```

### Output

```bash
{"status":"success","upload_url":"https://s3.us-west-000.backblazeb2.com/utJvm6MI/1-797f5226-bb52-40c6-a025-2d1f95effd30?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=00041f5c7ccf04d000000000d%2F20230802%2Fus-west-000%2Fs3%2Faws4_request&X-Amz-Date=20230802T094113Z&X-Amz-Expires=1800&X-Amz-Signature=31102ba07c7ded21a25b765abe196e7d7354d3372f8be510efcdcc9ce870467e&X-Amz-SignedHeaders=host&x-id=PutObject","file_id":"1-797f5226-bb52-40c6-a025-2d1f95effd30"}
```

This `upload_url` can be used to upload from the client browser directly.

_Remember to setup the CORS rules for the storage service, otherwise the request will be blocked by the browser_

## Upload the file form client

```bash
$ curl -vv -T public.asc "https://s3.us-west-000.backblazeb2.com/utJvm6MI/1-797f5226-bb52-40c6-a025-2d1f95effd30?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=00041f5c7ccf04d000000000d%2F20230802%2Fus-west-000%2Fs3%2Faws4_request&X-Amz-Date=20230802T094113Z&X-Amz-Expires=1800&X-Amz-Signature=31102ba07c7ded21a25b765abe196e7d7354d3372f8be510efcdcc9ce870467e&X-Amz-SignedHeaders=host&x-id=PutObject"
```

### Output

```
* processing: https://s3.us-west-000.backblazeb2.com/utJvm6MI/1-797f5226-bb52-40c6-a025-2d1f95effd30?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=00041f5c7ccf04d000000000d%2F20230802%2Fus-west-000%2Fs3%2Faws4_request&X-Amz-Date=20230802T094113Z&X-Amz-Expires=1800&X-Amz-Signature=31102ba07c7ded21a25b765abe196e7d7354d3372f8be510efcdcc9ce870467e&X-Amz-SignedHeaders=host&x-id=PutObject
*   Trying 206.190.208.254:443...
* Connected to s3.us-west-000.backblazeb2.com (206.190.208.254) port 443
* ALPN: offers h2,http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
*  CAfile: /etc/ssl/certs/ca-certificates.crt
*  CApath: none
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256
* ALPN: server did not agree on a protocol. Uses default.
* Server certificate:
*  subject: CN=backblazeb2.com
*  start date: Jul 25 17:38:19 2023 GMT
*  expire date: Oct 23 17:38:18 2023 GMT
*  subjectAltName: host "s3.us-west-000.backblazeb2.com" matched cert's "s3.us-west-000.backblazeb2.com"
*  issuer: C=US; O=Let's Encrypt; CN=R3
*  SSL certificate verify ok.
* using HTTP/1.x
> PUT /utJvm6MI/1-797f5226-bb52-40c6-a025-2d1f95effd30?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=00041f5c7ccf04d000000000d%2F20230802%2Fus-west-000%2Fs3%2Faws4_request&X-Amz-Date=20230802T094113Z&X-Amz-Expires=1800&X-Amz-Signature=31102ba07c7ded21a25b765abe196e7d7354d3372f8be510efcdcc9ce870467e&X-Amz-SignedHeaders=host&x-id=PutObject HTTP/1.1
> Host: s3.us-west-000.backblazeb2.com
> User-Agent: curl/8.2.0
> Accept: */*
> Content-Length: 1977
>
* We are completely uploaded and fine
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
< HTTP/1.1 200
< x-amz-request-id: bdad6798d76b0768
< x-amz-id-2: aNJwxnmbONSFjjTcUY9BjymaJMKU0wGRq
< ETag: "f7bf2028db5614b59107e23f4304b262"
< x-amz-version-id: 4_z64012f750cc7bc4c8f90041d_f1012e67fc3fca145_d20230802_m094217_c000_v0001410_t0052_u01690969337202
< Cache-Control: max-age=0, no-cache, no-store
< Content-Length: 0
< Date: Wed, 02 Aug 2023 09:42:16 GMT
<
```

## Complete the submission

### POST /done_submission

Use the `file_id` in `/add_submission`.  
The server can check whether the file is uploaded by `S3Client` or using lambda (AWS).

```bash
$ curl -X POST 'http://localhost:8881/done_submission?file_id=1-797f5226-bb52-40c6-a025-2d1f95effd30'
```

### Output

```bash
{"status":"success","message":"Submission completed"}
```

### If not found in the bucket

```bash
{"status":"error","message":"Submission 1-797f5226-bb52-40c6-a025-2d1f95effd30 has not finished uploading"}
```

## Download the file

### /get_download_url

```bash
$ curl 'http://localhost:8881/done_submission?file_id=1-797f5226-bb52-40c6-a025-2d1f95effd30'
```

### Output

```bash
{"status":"success","url":"https://s3.us-west-000.backblazeb2.com/utJvm6MI/1-797f5226-bb52-40c6-a025-2d1f95effd30?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=00041f5c7ccf04d000000000d%2F20230802%2Fus-west-000%2Fs3%2Faws4_request&X-Amz-Date=20230802T102354Z&X-Amz-Expires=1800&X-Amz-Signature=da67f9d89442ccfa4f010912faf7206d97a630bdf95589c7cb3297f9612ff11d&X-Amz-SignedHeaders=host&x-id=GetObject"}
```

This `url` can be used to download the file from the client browser directly.

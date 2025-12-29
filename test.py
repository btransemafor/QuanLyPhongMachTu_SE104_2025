
import http.client
import json


connection = http.client.HTTPSConnection('YOUR.PARSE-SERVER.HERE', 443)
connection.connect()
connection.request('POST', '/parse/files/hello.txt', 'Hello, World!', {
    "X-Parse-Application-Id": "DdKpt1rCkKQZ6QTEqwUz3WKDsand9oW0ArN2mWT2",
    "X-Parse-REST-API-Key": "${REST_API_KEY}",
    "Content-Type": "text/plain"
})
result = json.loads(connection.getresponse().read())
print(result)

const express = require('express');
const bodyParser = require('body-parser');
const database = require('./database'); // 데이터베이스 모듈을 포함

const app = express();
const port = 3000;

// JSON 형태의 요청을 처리하기 위한 미들웨어 설정
app.use(bodyParser.json());

let userStates = {};

// /setKeyword 엔드포인트: 키워드 설정 및 저장
app.post('/setKeyword', (req, res) => {
    const userRequest = req.body.userRequest;

    // 요청 유효성 검사
    if (!userRequest || !userRequest.user || !userRequest.utterance) {
        return res.status(400).send({ error: 'Invalid request format.' });
    }

    const userId = userRequest.user.id;
    const userMessage = userRequest.utterance; // 사용자가 입력한 메시지

    console.log('User message:', userMessage);
    console.log('Current userStates:', userStates);

    let responseText = '';

    userStates[userId] === 'awaiting_keyword'
    
    // 사용자의 현재 상태 확인 및 처리
    if (userStates[userId] === 'awaiting_keyword') {
        // 상태가 'awaiting_keyword'일 때, 즉 사용자가 키워드를 입력한 경우
        // 키워드 저장 처리
        database.saveKeyword(userId, userMessage, (err) => {
            if (err) {
                console.error('Database error:', err);
                responseText = '키워드 저장에 실패했습니다.';
            } else {
                responseText = `키워드 '${userMessage}'가 성공적으로 설정되었습니다.`;
                delete userStates[userId]; // 상태 초기화
            }

            // 응답 보내기
            const responseBody = {
                "version": "2.0",
                "template": {
                    "outputs": [
                        {
                            "simpleText": {
                                "text": responseText
                            }
                        }
                    ]
                }
            };

            res.status(200).send(responseBody);
        });

        return; // 키워드 저장이 완료되면 여기서 함수 종료
    }

    // '키워드 설정' 명령어를 받으면 상태를 'awaiting_keyword'로 설정
    if (userMessage === '키워드 설정') {
        userStates[userId] = 'awaiting_keyword';
        responseText = '키워드를 입력하세요.';

        // 응답 보내기
        const responseBody = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": responseText
                        }
                    }
                ]
            }
        };

        return res.status(200).send(responseBody);
    }

    // 기타 상황에 대한 응답
    responseText = '주제를 구분할 수 없습니다. "키워드 설정"을 입력하여 키워드를 설정하세요.';

    // 응답 보내기
    const responseBody = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": responseText
                    }
                }
            ]
        }
    };

    res.status(200).send(responseBody);
});

// 서버 종료 시 데이터베이스 연결 종료
process.on('SIGINT', () => {
    database.close();
    process.exit();
});

// 서버 실행
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

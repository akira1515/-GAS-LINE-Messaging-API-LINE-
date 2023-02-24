// 応答メッセージURL
const REPLY = "https://api.line.me/v2/bot/message/reply";

// アクセストークン
const ACCESS_TOKEN = "3ZlxWK7JxGfQdE1ag9GfHZrQ/x0TTVK94NldUhdlFip+rZhmGsOfYYLl95aAI3QtWPJlB0ZQ1oWi85htDcfQ2CRwo6xuSgbDlPwQn9lGJdV3qVr707YrqqbytUrbRB2Bc0IQVgILQ+K/dIvDwiZApQdB04t89/1O/w1cDnyilFU=";

// スプレッドシート情報
const SHEET_ID = '1H0_aH5WVqm2VjaXEhSi83bF1MrB0ZihbdBCy7FNHgsw';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1H0_aH5WVqm2VjaXEhSi83bF1MrB0ZihbdBCy7FNHgsw/edit#gid=351539368';
const SHEET_DATA = SpreadsheetApp.openById(SHEET_ID).getSheetByName('振り返り一覧');
const SHEET_LOG = SpreadsheetApp.openById(SHEET_ID).getSheetByName('ログ');

///////////////////////////////
// デプロイが成功したか確認
///////////////////////////////
function doGet(e) {

  let result = {};

  if (e.parameter == undefined) {
    // 受信に失敗した場合
    result['result'] = 'NG';
  } else {
    // 受信に成功した場合
    const val = e.parameter['val'];
    SHEET_DATA.appendRow([val]);
    result['result'] = 'OK';
  }

  return ContentService.createTextOutput(JSON.stringify(result));

}

///////////////////////////////
// lineからのメッセージを取得
///////////////////////////////
function doPost(e) {
  //メッセージ受信
  const data = JSON.parse(e.postData.contents).events[0];
  //ユーザーID取得
  const lineUserId = data.source.userId;
  // リプレイトークン取得
  const replyToken = data.replyToken;
  // 送信されたメッセージ取得
  const postType = data.message.type;
  const postMsg = data.message.text;
  // ログにポスト内容とユーザー情報を記載
  debugLog(postMsg, lineUserId);

  if (postMsg === "確認する") {
    // ユーザーID検索
    var userIdFinder = SHEET_DATA.createTextFinder(lineUserId);
    var userIdCells = userIdFinder.findAll();
    // カリキュラム状況を表示
    for (var i = 0; i < userIdCells.length; i++) {
      let pre_range = parseInt(userIdCells[i].getRowIndex())
      let inputGetNum = String(SHEET_DATA.getRange("D" + pre_range).getValue()); //インプット教材
      let drillGetNum = String(SHEET_DATA.getRange("E" + pre_range).getValue()); //ミニドリル
      let taskGetNum = String(SHEET_DATA.getRange("F" + pre_range).getValue());　//POSSE課題
      let allInputGetNum = String(SHEET_DATA.getRange("D2").getValue()); //初期値のインプット教材数
      let allDrillGetNum = String(SHEET_DATA.getRange("E2").getValue()); //初期値のミニドリル数
      let allTaskGetNum = String(SHEET_DATA.getRange("F2").getValue());　//初期値のPOSSE課題数
      let delayInputGetNum = String(SHEET_DATA.getRange("D3").getValue()); //遅れの基準値のインプット教材数
      let delayDrillGetNum = String(SHEET_DATA.getRange("E3").getValue()); //遅れの基準値のミニドリル数
      let delayTaskGetNum = String(SHEET_DATA.getRange("F3").getValue());　//遅れの基準値のPOSSE課題数
      flexMessage(replyToken, inputGetNum, drillGetNum, taskGetNum, allInputGetNum, allDrillGetNum, allTaskGetNum, delayInputGetNum, delayDrillGetNum, delayTaskGetNum);
      break;
    }
  } else {
    //「確認する」以外のメッセージは、初期登録をしようとしていると認識する。
    // 名前検索
    var textFinder = SHEET_DATA.createTextFinder(postMsg);
    var cells = textFinder.findAll();

    // ユーザーIDを登録する
    for (var i = 0; i < cells.length; i++) {
      let pre_range = parseInt(cells[i].getRowIndex())
      let range = SHEET_DATA.getRange("A" + pre_range);
      let rangeGet = range.getValue();
      if (range.isBlank()) {
        Logger.log("このセルは空白です");
        //登録する
        range.setValue(lineUserId);
        //「初期設定の登録完了」と表示
        updateSheetAndReply();
      } else if (lineUserId == rangeGet) {
        Logger.log("このセルは空白ではありません");
        //「あなたはすでに登録済みです。」と表示
        updatedSheetAndReply();
      } else if (lineUserId != rangeGet) {
        //「他の人が登録済みです。」と表示
        updatedSomeoneSheetAndReply();
      } else {
        ;
      }

      //「初期設定の登録完了」と表示する関数
      function updateSheetAndReply() {
        // LINEにメッセージを送信するコード
        const headers = {
          "Content-Type": "application/json; charset=UTF-8",
          "Authorization": "Bearer " + ACCESS_TOKEN,
        };

        const message = {
          "replyToken": replyToken,
          "messages": [
            {
              "type": "text",
              "text": "初期設定の登録完了。\n「確認する」とメッセージを送信してください。\n 今フェーズのカリキュラム状況を確認することができます。",
            },
          ],
        };

        const options = {
          "method": "post",
          "headers": headers,
          "payload": JSON.stringify(message),
        };

        const response = UrlFetchApp.fetch(REPLY, options);
        Logger.log(response.getContentText());
      }

      //「あなたはすでに登録済みです。」と表示する関数
      function updatedSheetAndReply() {
        // LINEにメッセージを送信するコード
        const headers = {
          "Content-Type": "application/json; charset=UTF-8",
          "Authorization": "Bearer " + ACCESS_TOKEN,
        };

        const message = {
          "replyToken": replyToken,
          "messages": [
            {
              "type": "text",
              "text": "あなたはすでに登録済みです。",
            },
          ],
        };

        const options = {
          "method": "post",
          "headers": headers,
          "payload": JSON.stringify(message),
        };

        const response = UrlFetchApp.fetch(REPLY, options);
        Logger.log(response.getContentText());
      }

      //「他の人が登録済みです。」と表示する関数
      function updatedSomeoneSheetAndReply() {
        // LINEにメッセージを送信するコード
        const headers = {
          "Content-Type": "application/json; charset=UTF-8",
          "Authorization": "Bearer " + ACCESS_TOKEN,
        };

        const message = {
          "replyToken": replyToken,
          "messages": [
            {
              "type": "text",
              "text": "他の人がすでに登録済みです。",
            },
          ],
        };

        const options = {
          "method": "post",
          "headers": headers,
          "payload": JSON.stringify(message),
        };

        const response = UrlFetchApp.fetch(REPLY, options);
        Logger.log(response.getContentText());
      }
    }
  }
}


///////////////////////////////
// テキストreplyメッセージ
///////////////////////////////
function sendMessage(replyToken, text) {
  let postData = {
    "replyToken": replyToken,
    "messages": [
      {
        "type": "text",
        "text": text
      }
    ]
  };
  return postMessage(postData);
}


///////////////////////////////
// JSON形式データをPOST
///////////////////////////////

function postMessage(postData) {
  const headers = {
    "Content-Type": "application/json; charset=UTF-8",
    "Authorization": "Bearer " + ACCESS_TOKEN
  };
  const options = {
    "method": "POST",
    "headers": headers,
    "payload": JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(REPLY, options);
}


///////////////////////////////
// ユーザーのプロフィール名取得(デバッグ記録に使用)
///////////////////////////////
function getUserDisplayName(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const userProfile = UrlFetchApp.fetch(url, {
    'headers': {
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
  })
  return JSON.parse(userProfile).displayName;
}


///////////////////////////////
// 「今フェーズのカリキュラム状況」を送信した時のメッセージ
///////////////////////////////
function flexMessage(replyToken, inputGetNum, drillGetNum, taskGetNum, allInputGetNum, allDrillGetNum, allTaskGetNum, delayInputGetNum, delayDrillGetNum, delayTaskGetNum) {
  //パーセンテージを表示する値  
  function ratioInputGetNum(inputGetNum, allInputGetNum) {
    if (parseInt(allInputGetNum) === 0) {
      return "なし";
    } else {
      return Math.floor((parseInt(allInputGetNum) - parseInt(inputGetNum)) / parseInt(allInputGetNum) * 100) + "%";
    }
  }

  function ratioDrillGetNum(drillGetNum, allDrillGetNum) {
    if (parseInt(allDrillGetNum) === 0) {
      return "なし";
    } else {
      return Math.floor((parseInt(allDrillGetNum) - parseInt(drillGetNum)) / parseInt(allDrillGetNum) * 100) + "%";
    }
  }

  function ratioTaskGetNum(taskGetNum, allTaskGetNum) {
    if (parseInt(allTaskGetNum) === 0) {
      return "なし";
    } else {
      return Math.floor((parseInt(allTaskGetNum) - parseInt(taskGetNum)) / parseInt(allTaskGetNum) * 100) + "%";
    }
  }


  //パーセンテージのゲージ値に使う値
  function gaugeRatioInputGetNum(inputGetNum, allInputGetNum) {
    if (parseInt(allInputGetNum) === 0) {
      return "0%";
    } else {
      return String(Math.floor((parseInt(allInputGetNum) - parseInt(inputGetNum)) / parseInt(allInputGetNum) * 100)) + "%";
    }
  }

  function gaugeRatioDrillGetNum(drillGetNum, allDrillGetNum) {
    if (parseInt(allDrillGetNum) === 0) {
      return "0%";
    } else {
      return String(Math.floor((parseInt(allDrillGetNum) - parseInt(drillGetNum)) / parseInt(allDrillGetNum) * 100)) + "%";
    }
  }

  function gaugeRatioTaskGetNum(taskGetNum, allTaskGetNum) {
    if (parseInt(allTaskGetNum) === 0) {
      return "0%";
    } else {
      return String(Math.floor((parseInt(allTaskGetNum) - parseInt(taskGetNum)) / parseInt(allTaskGetNum) * 100)) + "%";
    }
  }

  //遅れ：「」の数値を表示
  let delayInputValue = parseInt(inputGetNum) - parseInt(delayInputGetNum);
  let delayDrillValue = parseInt(drillGetNum) - parseInt(delayDrillGetNum);
  let delayTaskValue = parseInt(taskGetNum) - parseInt(delayTaskGetNum);

  //遅れいてるかどうかの判定色(カードの色)
  function backgroundColorInputCard(allInputGetNum, delayInputValue) {
    if (parseInt(allInputGetNum) === 0) {
      return "#C0C0C0";
    } else if (parseInt(delayInputValue) <= 0) {
      return "#33CCFF";
    } else {
      return "#FF6B6E";
    }
  };

  function backgroundColorDrillCard(allDrillGetNum, delayDrillValue) {
    if (parseInt(allDrillGetNum) === 0) {
      return "#C0C0C0";
    } else if (parseInt(delayDrillValue) <= 0) {
      return "#33CCFF";
    } else {
      return "#FF6B6E";
    }
  };

  function backgroundColorTaskCard(allTaskGetNum, delayTaskValue) {
    if (parseInt(allTaskGetNum) === 0) {
      return "#C0C0C0";
    } else if (parseInt(delayTaskValue) <= 0) {
      return "#33CCFF";
    } else {
      return "#FF6B6E";
    }
  };

  //遅れいてるかどうかの判定色(ゲージの色)
  function backgroundColorInputGauge(allInputGetNum, delayInputValue) {
    if (parseInt(allInputGetNum) === 0) {
      return "#C0C0C0";
    } else if (parseInt(delayInputValue) <= 0) {
      return "#0066FF";
    } else {
      return "#CC0000";
    }
  };

  function backgroundColorDrillGauge(allDrillGetNum, delayDrillValue) {
    if (parseInt(allDrillGetNum) === 0) {
      return "#C0C0C0";
    } else if (parseInt(delayDrillValue) <= 0) {
      return "#0066FF";
    } else {
      return "#CC0000";
    }
  };

  function backgroundColorTaskGauge(allTaskGetNum, delayTaskValue) {
    if (parseInt(allTaskGetNum) === 0) {
      return "#C0C0C0";
    } else if (parseInt(delayTaskValue) <= 0) {
      return "#0066FF";
    } else {
      return "#CC0000";
    }
  };


  let postData = {
    "replyToken": replyToken,
    "messages": [{
      "type": "flex",
      "altText": "this is a carousel template",
      "contents": {
        "type": "carousel",
        "contents": [
          {
            "type": "bubble",
            "size": "nano",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "インプット教材",
                  "color": "#ffffff",
                  "align": "start",
                  "size": "sm",
                  "gravity": "center",
                  "weight": "bold",
                  "action": {
                    "type": "postback",
                    "label": "action",
                    "data": "インプットはさらっと！"
                  }
                },
                {
                  "type": "text",
                  "text": `${ratioInputGetNum(inputGetNum, allInputGetNum)}`,
                  "color": "#ffffff",
                  "align": "start",
                  "size": "xs",
                  "gravity": "center",
                  "margin": "lg",
                  "weight": "bold"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "filler"
                        }
                      ],
                      "width": `${gaugeRatioInputGetNum(inputGetNum, allInputGetNum)}`,
                      "backgroundColor": `${backgroundColorInputGauge(allInputGetNum, delayInputValue)}`,
                      "height": "6px"
                    }
                  ],
                  "backgroundColor": "#FFFFFF",
                  "height": "6px",
                  "margin": "sm"
                }
              ],
              "backgroundColor": `${backgroundColorInputCard(allInputGetNum, delayInputValue)}`,
              "paddingTop": "19px",
              "paddingAll": "12px",
              "paddingBottom": "16px"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": `進捗：${(parseInt(allInputGetNum) - parseInt(inputGetNum))}/${allInputGetNum}`,
                      "size": "sm",
                      "wrap": true
                    },
                    {
                      "type": "text",
                      "text": `遅れ：${delayInputValue}`,
                      "size": "sm"
                    }
                  ],
                  "flex": 1,
                  "alignItems": "flex-start",
                  "justifyContent": "center"
                }
              ],
              "spacing": "md",
              "paddingAll": "12px"
            },
            "action": {
              "type": "postback",
              "label": "action",
              "data": "hello"
            },
            "styles": {
              "footer": {
                "separator": false
              }
            }
          },
          {
            "type": "bubble",
            "size": "nano",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "color": "#ffffff",
                  "align": "start",
                  "size": "sm",
                  "gravity": "center",
                  "text": "ミニドリル",
                  "weight": "bold",
                  "action": {
                    "type": "postback",
                    "label": "action",
                    "data": "hello"
                  }
                },
                {
                  "type": "text",
                  "text": `${ratioDrillGetNum(drillGetNum, allDrillGetNum)}`,
                  "color": "#ffffff",
                  "align": "start",
                  "size": "xs",
                  "gravity": "center",
                  "margin": "lg",
                  "weight": "bold"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "filler"
                        }
                      ],
                      "width": `${gaugeRatioDrillGetNum(drillGetNum, allDrillGetNum)}`,
                      "backgroundColor": `${backgroundColorDrillGauge(allDrillGetNum, delayDrillValue)}`,
                      "height": "6px"
                    }
                  ],
                  "height": "6px",
                  "margin": "sm",
                  "backgroundColor": "#FFFFFF"
                }
              ],
              "backgroundColor": `${backgroundColorDrillCard(allDrillGetNum, delayDrillValue)}`,
              "paddingTop": "19px",
              "paddingAll": "12px",
              "paddingBottom": "16px"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": `進捗：${(parseInt(allDrillGetNum) - parseInt(drillGetNum))}/${allDrillGetNum}`,
                      "size": "sm",
                      "wrap": true
                    },
                    {
                      "type": "text",
                      "text": `遅れ：${delayDrillValue}`,
                      "size": "sm"
                    }
                  ],
                  "flex": 1,
                  "justifyContent": "center",
                  "alignItems": "flex-start"
                }
              ],
              "spacing": "md",
              "paddingAll": "12px"
            },
            "action": {
              "type": "postback",
              "label": "action",
              "data": "hello"
            },
            "styles": {
              "footer": {
                "separator": false
              }
            }
          },
          {
            "type": "bubble",
            "size": "nano",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "POSSE課題",
                  "color": "#ffffff",
                  "align": "start",
                  "size": "sm",
                  "gravity": "center",
                  "weight": "bold",
                  "action": {
                    "type": "postback",
                    "label": "action",
                    "data": "hello"
                  }
                },
                {
                  "type": "text",
                  "text": `${ratioTaskGetNum(taskGetNum, allTaskGetNum)}`,
                  "color": "#ffffff",
                  "align": "start",
                  "size": "xs",
                  "gravity": "center",
                  "margin": "lg",
                  "weight": "bold"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "filler"
                        }
                      ],
                      "width": `${gaugeRatioTaskGetNum(taskGetNum, allTaskGetNum)}`,
                      "backgroundColor": `${backgroundColorTaskGauge(allTaskGetNum, delayTaskValue)}`,
                      "height": "6px"
                    }
                  ],
                  "backgroundColor": "#FFFFFF",
                  "height": "6px",
                  "margin": "sm"
                }
              ],
              "backgroundColor": `${backgroundColorTaskCard(allTaskGetNum, delayTaskValue)}`,
              "paddingTop": "19px",
              "paddingAll": "12px",
              "paddingBottom": "16px"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": `進捗：${(parseInt(allTaskGetNum) - parseInt(taskGetNum))}/${allTaskGetNum}`,
                      "size": "sm",
                      "wrap": true
                    },
                    {
                      "type": "text",
                      "text": `遅れ：${delayTaskValue}`,
                      "size": "sm"
                    }
                  ],
                  "flex": 1,
                  "justifyContent": "center",
                  "alignItems": "flex-start"
                }
              ],
              "spacing": "md",
              "paddingAll": "12px"
            },
            "action": {
              "type": "postback",
              "label": "action",
              "data": "hello"
            },
            "styles": {
              "footer": {
                "separator": false
              }
            }
          }
        ]
      }
    }
    ]
  };
  return postMessage(postData);

}

///////////////////////////////
//デバック記録
///////////////////////////////
function debugLog(text, userId) {
  const date = new Date();
  const userName = getUserDisplayName(userId);
  SHEET_LOG.appendRow([userId, `=IFERROR(VLOOKUP("${userId}",'メンバー'!A:B, 2, FALSE), "${userName}")`, text, Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')]);
}

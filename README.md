# kintone-Chatwork連携ツール

kintoneでレコードが追加・更新された際に、AIで内容を整理してChatworkに自動投稿するツールです。

## 機能

- kintoneからのWebhook受信
- **AI による重要データの自動抽出・整理**
- レコードデータの自動フォーマット
- Chatworkへの自動投稿
- エラーハンドリングとログ出力

### AI機能の特徴

AIが以下の重要項目を自動で抽出し、記載がある項目のみを整理して投稿します：

- 会社名
- 会社URL
- 電話番号
- 役職
- 氏名
- 携帯電話（数字のみ）
- メールアドレス
- 郵便番号（数字のみ）
- 日付
- 住所
- 申込みイベント
- 流入媒体
- **お問い合わせ内容（1文字も編集せず原文のまま記載）**

## セットアップ

### 1. 依存関係のインストール

```bash
cd kintone-chatwork-integration
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、以下の値を設定してください：

```bash
cp .env.example .env
```

必要な設定項目：

- `CHATWORK_API_TOKEN`: ChatworkのAPIトークン
- `CHATWORK_ROOM_ID`: 投稿先のChatworkルームID
- `PORT`: サーバーのポート番号（デフォルト: 3000）

AI機能を使用する場合（オプション）：

- `OPENAI_API_KEY`: OpenAI APIキー（GPT-3.5使用）
- `CLAUDE_API_KEY`: Claude APIキー（Claude 3 Haiku使用）
- `AI_PROVIDER`: 使用するAIプロバイダー（`openai` または `claude`）

### 3. Chatwork APIトークンの取得

1. Chatworkにログインし、[API設定ページ](https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php)にアクセス
2. 新しいAPIトークンを生成
3. トークンを`.env`ファイルに設定

### 4. ChatworkルームIDの確認

1. 対象のChatworkルームを開く
2. URLの数字部分がルームIDです（例：`https://www.chatwork.com/#!rid123456` の場合、`123456`）

### 5. AI APIキーの取得（オプション）

#### OpenAI APIの場合：
1. [OpenAI Platform](https://platform.openai.com/api-keys)にアクセス
2. 新しいAPIキーを作成
3. `.env`ファイルの`OPENAI_API_KEY`に設定

#### Claude APIの場合：
1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. APIキーを作成
3. `.env`ファイルの`CLAUDE_API_KEY`に設定

**注意**: AI機能はオプションです。APIキーが設定されていない場合は従来の方式でデータを整理します。

## 使用方法

### サーバーの起動

```bash
# 本番環境
npm start

# 開発環境（ファイル変更時に自動再起動）
npm run dev
```

### kintoneでのWebhook設定

1. kintoneアプリの設定を開く
2. 「一般設定」→「Webhook」を選択
3. 以下の設定を行う：
   - **Webhook URL**: `http://your-server.com:3000/webhook/kintone`
   - **イベント**: 「レコード追加時」「レコード更新時」を選択
   - **HTTPメソッド**: POST

## API仕様

### Webhook受信エンドポイント

```
POST /webhook/kintone
```

kintoneから送信されるWebhookデータを受信し、Chatworkに投稿します。

### ヘルスチェック

```
GET /health
```

サーバーの動作状況を確認できます。

## データフォーマット

### AI機能を使用した場合

```
[info][title]kintone レコード新規追加通知[/title]
アプリID: 123
レコード番号: 456
更新時刻: 2024/01/01 12:34:56

【AIで整理されたデータ】
■ 会社名: 株式会社サンプル
■ 氏名: 田中太郎
■ メールアドレス: tanaka@example.com
■ 携帯電話: 09012345678
■ お問い合わせ内容: 製品の詳細について教えてください。価格も知りたいです。
[/info]
```

### AI機能を使用しない場合

```
[info][title]kintone レコード新規追加通知[/title]
アプリID: 123
レコード番号: 456
更新時刻: 2024/01/01 12:34:56

【主要フィールド】
タイトル: サンプルタイトル
状態: 進行中
[/info]
```

## カスタマイズ

### AI抽出項目の変更

`src/services/aiService.js`の`createPrompt`関数内の「抽出対象項目」リストを編集してください。

### メッセージフォーマットの変更

`src/utils/dataFormatter.js`の`formatKintoneData`関数を編集してください。

### 従来方式の表示フィールドの変更

`src/utils/dataFormatter.js`の`extractMainFields`関数内の`priorityFields`配列を編集してください。

## トラブルシューティング

### よくある問題

1. **Chatworkに投稿されない**
   - APIトークンとルームIDが正しく設定されているか確認
   - ネットワーク接続を確認

2. **Webhookが受信されない**
   - サーバーが起動しているか確認
   - ファイアウォール設定を確認
   - kintoneのWebhook URLが正しいか確認

3. **AI機能が動作しない**
   - OpenAIまたはClaude APIキーが正しく設定されているか確認
   - API利用制限に達していないか確認
   - ネットワーク接続を確認

4. **エラーログの確認**
   ```bash
   # サーバーログを確認
   npm start
   ```

### ログレベル

- 正常処理: 標準出力
- エラー: エラー出力（赤色で表示）

## ライセンス

MIT License
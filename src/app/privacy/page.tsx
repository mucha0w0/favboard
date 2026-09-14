import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/components/layout/LegalDocument";
import {
  CONTACT_URL,
  LEGAL_EFFECTIVE_DATE,
  OPERATOR_NAME,
  SERVICE_NAME,
} from "@/lib/legal";
import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー — Favboard",
  description:
    "Favboard（ファブボード）のプライバシーポリシー。X連携、プロフィール画像、公開投稿の取扱いを定めています。",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="プライバシーポリシー" current="privacy">
      <LegalSection id="intro" title="1. はじめに">
        <p>
          {OPERATOR_NAME}（以下「運営者」）は、{SERVICE_NAME}
          （以下「本サービス」）における利用者情報の取扱いについて、このプライバシーポリシー（以下「本ポリシー」）を定めます。本サービスを利用する前に、あわせて
          <Link
            href="/terms"
            className="text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
          >
            利用規約
          </Link>
          をご確認ください。
        </p>
      </LegalSection>

      <LegalSection id="operator" title="2. 運営者">
        <LegalList
          items={[
            `サービス名: ${SERVICE_NAME}`,
            `運営者: ${OPERATOR_NAME}`,
            <>
              お問い合わせ:{" "}
              <a
                href={CONTACT_URL}
                className="text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>
            </>,
          ]}
        />
        <p>
          本サービスは個人による運営です。お問い合わせへの回答にはお時間をいただく場合があります。
        </p>
      </LegalSection>

      <LegalSection id="data" title="3. 取得する情報">
        <p>
          運営者は、本サービスの提供にあたり、次の情報を取得します。法令上の個人情報に該当するものを含みます。
        </p>
        <h3 className="pt-2 text-sm font-semibold text-stone-800">
          3.1 X（旧Twitter）連携により取得する情報
        </h3>
        <p>
          本サービスのログインは、Xのアカウントによる外部認証（OAuth）です。認証処理は運営者が委託する認証基盤（Supabase
          Auth）を通じて行われます。利用者がX上で本サービスへの連携を許可すると、Xおよび認証基盤の仕様に従い、おおむね次の情報が渡されます。
        </p>
        <LegalList
          items={[
            "X上のユーザー識別子",
            "ユーザー名（@から始まるハンドル）",
            "表示名",
            "プロフィール画像のURL",
            "X側の設定および権限により提供される場合があるメールアドレス",
            "ログイン維持のためのアクセストークン・リフレッシュトークン等の認証情報",
          ]}
        />
        <p>
          本サービスは、Xのタイムライン取得、投稿内容の収集、フォロワー情報の分析、利用者の代わりにXへ投稿する処理は行いません。シェア機能は、利用者がボタンを押したときにXの投稿画面（Web
          Intent）を開くだけです。投稿するかどうかは利用者自身の操作に委ねられます。
        </p>
        <p>
          認証基盤の仕様上、Xが発行するトークンが保存されることがありますが、運営者はこれを上記以外の目的（投稿の代行や閲覧履歴の追跡など）には使用しません。
        </p>

        <h3 className="pt-2 text-sm font-semibold text-stone-800">
          3.2 利用者が入力・アップロードする情報
        </h3>
        <LegalList
          items={[
            "本サービス上のユーザーID、表示名、プロフィール画像",
            "ボード（リスト）のタイトル、本文、見出し、配置、公開／非公開の設定",
            "商品ブロックに含まれる名称、ブランド、価格、コメント、公式サイトURL、画像および切り抜き範囲",
          ]}
        />

        <h3 className="pt-2 text-sm font-semibold text-stone-800">
          3.3 利用に伴い自動的に取得する情報
        </h3>
        <LegalList
          items={[
            "ログインセッションを維持するためのCookie等",
            "ホスティング環境が通信の過程で記録し得るIPアドレス、ブラウザ種別、アクセス日時などの技術的情報",
          ]}
        />
        <p>
          本サービスは、本ポリシー制定時点において、広告配信や第三者の行動解析タグを埋め込んでいません。今後導入する場合は、本ポリシーを更新したうえでお知らせします。
        </p>
      </LegalSection>

      <LegalSection id="purpose" title="4. 利用目的">
        <p>取得した情報は、次の目的で利用します。</p>
        <LegalList
          items={[
            "アカウントの作成、認証、ログイン状態の維持",
            "プロフィールおよびボードの保存、表示、公開、非公開",
            "公開ページやシェア用画像（OGP / Xカード）の生成",
            "お問い合わせへの対応、不正利用の防止、セキュリティの確保",
            "サービスの改善、障害対応、利用規約に基づく運用",
            "法令または公的機関からの要請への対応",
          ]}
        />
        <p>
          運営者は、本人の同意がある場合または法令で認められる場合を除き、上記の目的以外に個人情報を利用しません。
        </p>
      </LegalSection>

      <LegalSection id="avatar" title="5. プロフィール画像の取扱い">
        <p>
          初めてログインしたとき、本サービスはXから受け取ったプロフィール画像のURLを、初期のプロフィール画像として保存することがあります。その後、ダッシュボードから画像の差し替えや削除ができます。
        </p>
        <LegalList
          items={[
            "X由来の画像は、原則としてXのサーバー上のURLを参照します。公開ページを開いた閲覧者のブラウザが、画像取得のためにX側へリクエストを送ることがあります。",
            "利用者がアップロードした画像は、正方形にトリミングしたうえで本サービスのデータベースに保存します（外部の画像専用ストレージへは置きません）。",
            "プロフィール画像、表示名、ユーザーIDは、公開ボードの作成者情報として表示されます。また、本サービスの仕様上、他の利用者からも参照できる情報として取り扱います。",
            "画像を削除すると、本サービス上の保存データからは取り除きます。ただし、既にシェアされた投稿、ブラウザキャッシュ、検索結果など、本サービス外に残ったコピーまでは制御できません。",
          ]}
        />
      </LegalSection>

      <LegalSection id="public" title="6. 公開投稿（ボード）の取扱い">
        <p>
          ボードは作成時点では非公開です。利用者が公開操作をしたボードだけが、固有のURL（
          <code className="rounded bg-stone-100 px-1 py-0.5 text-[13px] text-stone-700">
            /c/スラッグ
          </code>
          ）で誰でも閲覧できます。
        </p>
        <LegalList
          items={[
            "公開ボードのタイトル、本文、商品情報、画像、作成者のプロフィールは、ログインしていない訪問者を含む第三者に表示されます。",
            "公開ボードは、検索エンジンや、X・その他のサービスがリンク先のプレビュー（OGP）を取得するために読み取ることがあります。本サービスは、公開ボード向けにシェア用画像を生成します。",
            "非公開のボードは、原則として本人にしか表示しません。下書きのプレビューは、ログイン中の本人に限られます。",
            "公開を取り消すと、本サービスの公開URLからは見えなくなります。ただし、既にXなどへ投稿されたリンク、外部のキャッシュやプレビュー画像までは削除できません。",
            "公開ボードを削除すると、本サービス上の当該データは削除されます。外部に複製された情報の削除は、各サービスの手続きに従って利用者自身で行ってください。",
          ]}
        />
        <p>
          公開する内容に、第三者の個人情報、顔写真、連絡先、機密情報などを含めないでください。公開は利用者の責任で行っていただきます。
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="7. 外部サービスへの提供">
        <p>
          運営者は、次の外部事業者に、本サービスの提供に必要な範囲で情報の取扱いを委託し、または当該事業者のサービス上で情報を処理します。
        </p>
        <LegalList
          items={[
            "認証・データベース: Supabase（Supabase Auth および PostgreSQL）",
            "ホスティング: Vercel",
            "ログイン連携先: X Corp.（X / Twitter の認証サービス）",
          ]}
        />
        <p>
          利用者が公開ボードをシェアすると、その公開URLおよびプレビュー情報は、Xその他の利用者が選んだサービスへ渡ります。これは利用者自身の操作による提供です。
        </p>
        <p>
          法令に基づく場合、人の生命・身体・財産の保護に必要で本人同意を得ることが困難な場合、その他法令で認められる場合を除き、本人同意なく個人情報を第三者へ提供しません。
        </p>
      </LegalSection>

      <LegalSection id="foreign" title="8. 外国にある第三者への提供">
        <p>
          前条の外部サービスは、日本国外のサーバーで情報を処理することがあります。この場合、当該国の個人情報保護制度は日本と異なることがあります。運営者は、本サービスの提供に必要な範囲に限って当該処理を行い、各事業者の契約・セキュリティ慣行を確認するよう努めます。
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="9. Cookie等">
        <p>
          本サービスは、ログイン状態の維持など、サービス提供に不可欠なCookieを使用します。これらは認証基盤が発行するセッション用のCookieであり、広告目的では使用しません。ブラウザの設定でCookieを拒否すると、ログインが維持できないことがあります。
        </p>
      </LegalSection>

      <LegalSection id="retention" title="10. 保管期間">
        <p>
          利用者情報は、利用目的の達成に必要な期間、または法令で保管が求められる期間、保存します。アカウントが削除された場合、認証情報およびプロフィール、当該利用者のボードは、バックアップ上の残存分を除き削除します。バックアップからの完全な消去には、運用上のタイムラグが生じることがあります。
        </p>
      </LegalSection>

      <LegalSection id="rights" title="11. 開示・訂正・削除等">
        <p>利用者は、本サービス上で次の操作を自ら行えます。</p>
        <LegalList
          items={[
            "表示名、ユーザーID、プロフィール画像の変更および画像の削除",
            "ボードの編集、公開／非公開の切替、削除",
            "ログアウト（端末上のログイン状態の終了）",
            "ダッシュボードからのアカウント削除（退会）",
          ]}
        />
        <p>
          アカウントを削除すると、認証情報、プロフィール、および当該利用者のボードは、バックアップ上の残存分を除き削除されます。保有個人データの開示・訂正・利用停止等を画面操作以外で希望する場合は、第2条の連絡先までご請求ください。ご本人確認ができる場合に限り、法令に従い対応します。請求者がご本人であることが確認できないときは、対応をお断りすることがあります。
        </p>
      </LegalSection>

      <LegalSection id="security" title="12. 安全管理">
        <p>
          運営者は、アクセス制御（行レベルセキュリティを含む）、通信の暗号化（HTTPS）、認証情報の外部認証基盤への委任など、取り扱う情報の量および個人運営であることに照らして合理的な安全管理措置を講じます。ただし、インターネット上の通信の完全な安全を保証するものではありません。
        </p>
      </LegalSection>

      <LegalSection id="minors" title="13. 未成年の方へ">
        <p>
          未成年の方が本サービスを利用する場合は、保護者の方の同意を得たうえでご利用ください。保護者の方からの削除等の請求にも、ご本人確認のうえ対応します。
        </p>
      </LegalSection>

      <LegalSection id="changes" title="14. 本ポリシーの変更">
        <p>
          運営者は、法令の改正やサービスの変更に応じて本ポリシーを改定することがあります。重要な変更を行う場合は、本サービス上での掲示その他適切な方法で周知します。改定後に本サービスを利用した場合、改定後の本ポリシーに同意したものとして取り扱います。
        </p>
      </LegalSection>

      <LegalSection id="contact" title="15. お問い合わせ">
        <p>
          個人情報の取扱いに関するお問い合わせ、苦情、開示等のご請求は、
          <a
            href={CONTACT_URL}
            className="text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Issues
          </a>
          までお願いします。個人情報をIssueの本文に書き込まないでください。連絡先の交換が必要な場合は、その旨だけをご記載ください。
        </p>
        <p className="text-xs text-stone-400">
          制定・施行: {LEGAL_EFFECTIVE_DATE}
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

const SUPABASE_URL = 'https://xegdmcocffmtssrmvpir.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Y_ELJBnCQMPBJrXJPmB3KA_BL2tEc7T';
const COMMENTS_ENDPOINT = `${SUPABASE_URL}/rest/v1/comments`;
const commentForm = document.querySelector('#comment-form');
const commentName = document.querySelector('#comment-name');
const commentContent = document.querySelector('#comment-content');
const commentMessage = document.querySelector('#comment-message');
const commentsList = document.querySelector('#comments-list');
const commentCounter = document.querySelector('#comment-counter');

const apiHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

function formatCommentDate(value) {
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

function renderComments(comments) {
  commentsList.replaceChildren();
  if (!comments.length) {
    const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = '最初のコメントを投稿してみませんか。'; commentsList.appendChild(empty); return;
  }
  comments.forEach((comment) => {
    const article = document.createElement('article'); article.className = 'comment-item';
    const header = document.createElement('header');
    const avatar = document.createElement('span');
    avatar.className = 'comment-avatar';
    avatar.textContent = comment.handle_name.slice(0, 1).toUpperCase();
    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const name = document.createElement('strong'); name.textContent = comment.handle_name;
    const date = document.createElement('time'); date.dateTime = comment.created_at; date.textContent = formatCommentDate(comment.created_at);
    const content = document.createElement('p'); content.textContent = comment.content;
    meta.append(name, date); header.append(avatar, meta); article.append(header, content); commentsList.appendChild(article);
  });
}

async function loadComments() {
  try {
    const response = await fetch(`${COMMENTS_ENDPOINT}?select=id,handle_name,content,created_at&id=neq.2&order=created_at.desc&limit=50`, { headers: apiHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    renderComments(await response.json());
  } catch {
    commentsList.replaceChildren();
    const message = document.createElement('p'); message.className = 'comment-error'; message.textContent = 'コメントを読み込めませんでした。しばらくしてから再度お試しください。'; commentsList.appendChild(message);
  }
}

commentContent.addEventListener('input', () => { commentCounter.textContent = `${commentContent.value.length} / 500`; });
commentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  commentMessage.textContent = '';
  if (commentForm.elements.website.value) return;
  const handleName = commentName.value.trim();
  const content = commentContent.value.trim();
  if (!handleName || !content) { commentMessage.textContent = 'ハンドルネームと投稿内容を入力してください。'; return; }
  if (handleName.length > 30 || content.length > 500) { commentMessage.textContent = '文字数の上限を確認してください。'; return; }
  const submit = commentForm.querySelector('button[type="submit"]');
  submit.disabled = true; submit.textContent = '送信中…';
  try {
    const response = await fetch(COMMENTS_ENDPOINT, { method: 'POST', headers: { ...apiHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ handle_name: handleName, content }) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    commentContent.value = ''; commentCounter.textContent = '0 / 500'; commentMessage.textContent = 'コメントを投稿しました。';
    await loadComments();
  } catch {
    commentMessage.textContent = '投稿できませんでした。しばらくしてから再度お試しください。';
  } finally {
    submit.disabled = false; submit.textContent = 'コメントを投稿';
  }
});

loadComments();



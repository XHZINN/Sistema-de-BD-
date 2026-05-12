import os
import smtplib
import email as email_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from imapclient import IMAPClient
from database import supabase

EMAIL_ADDRESS = os.environ.get('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')
IMAP_SERVER   = os.environ.get('IMAP_SERVER', 'imap.gmail.com')
SMTP_SERVER   = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')


def _decode_header(value: str) -> str:
    parts = decode_header(value)
    result = []
    for part, charset in parts:
        if isinstance(part, bytes):
            result.append(part.decode(charset or 'utf-8', errors='replace'))
        else:
            result.append(part)
    return ''.join(result)


def _get_body(msg) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                return part.get_payload(decode=True).decode('utf-8', errors='replace')
    else:
        return msg.get_payload(decode=True).decode('utf-8', errors='replace')
    return ''


def _find_cliente(remetente: str):
    """Busca id_cliente pelo email_oficial primeiro, depois em contatos."""
    # 1. email oficial
    res = supabase.table('cliente').select('id_cliente').eq('email_oficial', remetente).execute()
    if res.data:
        return res.data[0]['id_cliente'], 'vinculado'

    # 2. tabela contatos
    res = supabase.table('contatos').select('id_cliente').eq('email', remetente).execute()
    if res.data:
        return res.data[0]['id_cliente'], 'sugerido'

    return None, 'desconhecido'


def checar_emails():
    """Job periódico — busca emails não lidos e salva na tabela mensagens."""
    try:
        with IMAPClient(IMAP_SERVER, ssl=True) as client:
            client.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            client.select_folder('INBOX')

            uids = client.search(['UNSEEN'])
            if not uids:
                return

            messages = client.fetch(uids, ['RFC822'])

            for uid, data in messages.items():
                raw = data[b'RFC822']
                msg = email_lib.message_from_bytes(raw)

                remetente_raw = msg.get('From', '')
                # extrai só o email de "Nome <email@x.com>"
                if '<' in remetente_raw:
                    remetente = remetente_raw.split('<')[1].rstrip('>')
                else:
                    remetente = remetente_raw.strip()

                id_externo = str(uid)
                conteudo   = _get_body(msg)

                # evita duplicatas
                existe = supabase.table('mensagens') \
                    .select('id_mensagem') \
                    .eq('id_externo', id_externo) \
                    .eq('canal', 'email') \
                    .execute()
                if existe.data:
                    continue

                id_cliente, status_vinculo = _find_cliente(remetente.lower())

                REMETENTES_IGNORADOS = [
                    'no-reply@accounts.google.com',
                    'no-reply@google.com',
                ]

                if remetente.lower() in REMETENTES_IGNORADOS:
                    continue

                supabase.table('mensagens').insert({
                    'id_cliente':     id_cliente,
                    'canal':          'email',
                    'direcao':        'recebida',
                    'conteudo':       conteudo.strip(),
                    'lida':           False,
                    'id_externo':     id_externo,
                    'remetente':      remetente.lower(),
                    'status_vinculo': status_vinculo,
                }).execute()

    except Exception as e:
        print(f'[email_service] Erro ao checar emails: {e}')


def enviar_email(destinatario: str, conteudo: str):
    """Envia um email via SMTP."""
    msg = MIMEMultipart()
    msg['From']    = EMAIL_ADDRESS
    msg['To']      = destinatario
    msg['Subject'] = 'Resposta - Adriano Consultoria'
    msg.attach(MIMEText(conteudo, 'plain', 'utf-8'))

    with smtplib.SMTP_SSL(SMTP_SERVER, 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, destinatario, msg.as_string())
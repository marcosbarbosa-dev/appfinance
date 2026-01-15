
# Estrutura de Dados Recomendada (Cloud Firestore)

## Coleção: `users`
Armazena as informações básicas e permissões de cada usuário.
- `uid`: string (Document ID)
- `email`: string
- `name`: string
- `role`: string ('admin' | 'user')
- `isActive`: boolean
- `isFirstLogin`: boolean
- `createdAt`: timestamp
- `avatarUrl`: string (opcional)

## Coleção: `transactions`
Armazena todos os lançamentos financeiros.
- `id`: string (Document ID)
- `userId`: string (Indexado para consultas rápidas)
- `description`: string
- `amount`: number (Valores positivos para entradas, negativos para saídas)
- `type`: string ('income' | 'expense' | 'credit_card')
- `category`: string (Nome ou ID da categoria)
- `date`: timestamp
- `accountId`: string (Relacionado à conta bancária)

## Coleção: `categories`
Categorias pré-definidas ou personalizáveis.
- `id`: string (Document ID)
- `userId`: string (null para categorias globais do sistema)
- `name`: string
- `icon`: string (FontAwesome icon name)
- `color`: string (Hex code)

## Coleção: `accounts`
Contas bancárias/carteiras de cada usuário.
- `id`: string (Document ID)
- `userId`: string
- `name`: string
- `type`: string ('checking', 'savings', 'investment', etc)
- `balance`: number (Saldo calculado ou atualizado via triggers)

---

### Regras de Segurança (Firestore Rules)
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas admins podem listar/gerenciar todos os usuários
    match /users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Usuários comuns só vêem suas próprias transações
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

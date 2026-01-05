# Strava API Integration Notes

## Authentication
- OAuth 2.0 required
- Authorization URL: `http://www.strava.com/oauth/authorize?client_id=[CLIENT_ID]&response_type=code&redirect_uri=[REDIRECT_URI]&approval_prompt=force&scope=[SCOPES]`
- Token Exchange URL: `https://www.strava.com/oauth/token`
- Tokens expire every 6 hours, need refresh token

## Required Scopes
- `activity:read` - Read public activities
- `activity:read_all` - Read all activities (including private)
- `profile:read_all` - Read athlete profile

## Key Endpoints

### List Athlete Activities
```
GET /athlete/activities
```
Parameters:
- `before` (epoch timestamp) - Only activities before this time
- `after` (epoch timestamp) - Only activities after this time
- `page` (integer) - Page number
- `per_page` (integer) - Number per page (max 200)

### Get Activity
```
GET /activities/{id}
```
Returns detailed activity including:
- distance (meters)
- moving_time (seconds)
- elapsed_time (seconds)
- total_elevation_gain (meters)
- type (Run, Ride, Swim, etc.)
- sport_type (more specific)
- start_date
- average_speed
- max_speed
- average_heartrate
- max_heartrate
- calories

## Activity Types (sport_type)
- Run, TrailRun, VirtualRun
- Ride, MountainBikeRide, GravelRide, VirtualRide
- Swim
- Walk, Hike
- Workout, WeightTraining
- Yoga, Pilates
- Rowing, Kayaking
- Elliptical, StairStepper
- CrossFit, HIIT

## Rate Limits
- 200 requests per 15 minutes
- 2,000 requests per day

## Implementation Plan
1. Create Strava OAuth flow (client_id, client_secret needed)
2. Store tokens in database (access_token, refresh_token, expires_at)
3. Create sync endpoint to fetch activities
4. Map Strava activities to cardio_logs table


---

# Garmin Connect API Notes

## Acesso
- **Programa para empresas aprovadas** - requer aplicação e aprovação
- Não disponível para uso pessoal/individual
- Gratuito para desenvolvedores de negócios aprovados

## Activity API Features
- REST Architecture
- Ping/Pull ou Push Architecture
- Customized Data Feeds
- Multi-Project Support
- Full Activity Details Access (FIT, GPX, TCX formats)

## Tipos de Atividades Suportadas
- Running
- Cycling
- Swimming
- Yoga
- Strength Training

## Alternativas para Integração Garmin
Como a API oficial do Garmin requer aprovação empresarial, podemos usar:
1. **Terra API** - Agregador que conecta com Garmin
2. **Spike API** - Outro agregador de wearables
3. **ROOK API** - Integração simplificada
4. **Importação manual de arquivos FIT/GPX/TCX**

## Recomendação
Para o FitPrime Manager, a melhor abordagem seria:
1. Integração direta com **Strava** (API pública, fácil de usar)
2. Opção de **importar arquivo manualmente** (FIT, GPX, TCX)
3. Futuramente, considerar agregadores como Terra ou Spike


---

# Apple Health Notes

## Limitações
- **NÃO existe API web** para Apple Health
- Dados são armazenados localmente no iPhone
- Requer app nativo iOS para acessar HealthKit
- Não há backend API ou acesso web direto

## Alternativas para Integração
1. **Terra SDK** - SDK mobile (Swift, React Native, Flutter) que acessa Apple Health
2. **Importação manual de XML** - Usuário exporta dados do Apple Health e faz upload
3. **Apps de terceiros** como "Health Auto Export" que exportam para JSON/CSV

## Recomendação para FitPrime Manager
Como somos uma aplicação web, as opções são:
1. **Importação manual de arquivo** - usuário exporta do Apple Health e faz upload
2. **Integração via Strava** - muitos usuários de Apple Watch sincronizam com Strava
3. **Futuramente** - criar app mobile que sincroniza com backend

---

# Estratégia Final de Integração

## Fase 1 (Implementar agora)
1. **Strava** - Integração OAuth completa
2. **Importação manual** - Upload de arquivos GPX/TCX/FIT

## Fase 2 (Futuro)
1. **Garmin** - Via agregador (Terra/Spike) ou aplicação empresarial
2. **Apple Health** - Via app mobile ou importação XML

## Dados a Sincronizar
- Tipo de atividade (corrida, bike, natação, etc.)
- Distância
- Duração
- Calorias
- Frequência cardíaca (média/máxima)
- Data/hora
- Ritmo/velocidade

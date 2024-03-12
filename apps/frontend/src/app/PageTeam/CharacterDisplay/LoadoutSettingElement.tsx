import {
  BootstrapTooltip,
  CardThemed,
  ModalWrapper,
  SqBadge,
} from '@genshin-optimizer/common/ui'
import { useDatabase } from '@genshin-optimizer/gi/db-ui'
import { getCharData } from '@genshin-optimizer/gi/stats'
import AddIcon from '@mui/icons-material/Add'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import PersonIcon from '@mui/icons-material/Person'
import {
  Alert,
  Box,
  Button,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Typography,
} from '@mui/material'
import { useContext, useDeferredValue, useEffect, useState } from 'react'
import CloseButton from '../../Components/CloseButton'
import { TeamCharacterContext } from '../../Context/TeamCharacterContext'
import { LoadoutDropdown } from '../LoadoutDropdown'
import { Build } from './Build/Build'
import { BuildEquipped } from './Build/BuildEquipped'
import BuildTc from './Build/BuildTc'
// TODO: Translation

export default function LoadoutSettingElement() {
  const {
    teamId,
    teamCharId,
    teamChar: {
      key: characterKey,
      buildType,
      buildId,
      buildIds,
      buildTcId,
      buildTcIds,
    },
  } = useContext(TeamCharacterContext)

  const weaponTypeKey = getCharData(characterKey).weaponType

  const database = useDatabase()
  const teamChar = database.teamChars.get(teamCharId)!
  const [open, setOpen] = useState(false)

  const [name, setName] = useState(teamChar.name)
  const nameDeferred = useDeferredValue(name)
  const [desc, setDesc] = useState(teamChar.description)
  const descDeferred = useDeferredValue(desc)

  // trigger on teamCharId change, to use the new team's name/desc
  useEffect(() => {
    const newTeamChar = database.teamChars.get(teamCharId)
    if (!newTeamChar) return
    const { name, description } = newTeamChar
    setName(name)
    setDesc(description)
  }, [database, teamCharId])

  useEffect(() => {
    database.teamChars.set(teamCharId, (teamChar) => {
      teamChar.name = nameDeferred
    })
    // Don't need to trigger when teamCharId is changed, only when the name is changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [database, nameDeferred])

  useEffect(() => {
    database.teamChars.set(teamCharId, (teamChar) => {
      teamChar.description = descDeferred
    })
    // Don't need to trigger when teamCharId is changed, only when the name is changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [database, descDeferred])

  const onChangeTeamCharId = (newTeamCharId: string) => {
    const index = database.teams
      .get(teamId)!
      .teamCharIds.findIndex((id) => id === teamCharId)
    if (index < 0) return
    database.teams.set(teamId, (team) => {
      team.teamCharIds[index] = newTeamCharId
    })
  }
  return (
    <>
      <Box display="flex" gap={1} alignItems="center">
        <BootstrapTooltip
          title={<Typography>{teamChar.description}</Typography>}
        >
          <Button
            startIcon={<PersonIcon />}
            color="info"
            onClick={() => setOpen((o) => !o)}
          >
            <Typography sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <strong>{teamChar.name}</strong>
              <SqBadge
                color="success"
                sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
              >
                <CheckroomIcon />
                <span>{database.teamChars.getActiveBuildName(teamCharId)}</span>
              </SqBadge>
              <SqBadge color={buildIds.length ? 'primary' : 'secondary'}>
                {buildIds.length} Builds
              </SqBadge>
              <SqBadge color={buildTcIds.length ? 'primary' : 'secondary'}>
                {buildTcIds.length} TC Builds
              </SqBadge>
            </Typography>
          </Button>
        </BootstrapTooltip>
      </Box>

      <ModalWrapper open={open} onClose={() => setOpen(false)}>
        <CardThemed>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <PersonIcon />
                <span>Loadout Settings</span>
              </Box>
            }
            action={<CloseButton onClick={() => setOpen(false)} />}
          />
          <Divider />
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Alert variant="filled" severity="info">
              <strong>Loadouts</strong> provides character context data,
              including bonus stats, conditionals, multi-tagets, optimization
              config, and stores builds. A single <strong>Loadout</strong> can
              be used for many teams.
            </Alert>
            <LoadoutDropdown
              teamCharId={teamCharId}
              onChangeTeamCharId={onChangeTeamCharId}
              dropdownBtnProps={{ fullWidth: true }}
            />
            <TextField
              fullWidth
              label="Loadout Name"
              placeholder="Loadout Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Loadout Description"
              placeholder="Loadout Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              multiline
              rows={4}
            />
          </CardContent>
          <Divider />
          <CardHeader
            title={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <CheckroomIcon />
                <span>Build Management</span>
              </Box>
            }
          />
          <Divider />
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Alert variant="filled" severity="info">
              A <strong>Build</strong> is comprised of a weapon and 5 artifacts.
              A <strong>TC Build</strong> allows the artifacts to be created
              from its stats.
            </Alert>
            <BuildEquipped active={buildType === 'equipped'} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6">Builds</Typography>
              <Button
                startIcon={<AddIcon />}
                color="info"
                size="small"
                onClick={() => database.teamChars.newBuild(teamCharId)}
              >
                New Build
              </Button>
            </Box>

            {buildIds.map((id) => (
              <Build
                key={id}
                buildId={id}
                active={buildType === 'real' && buildId === id}
              />
            ))}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="h6">TC Builds</Typography>
              <Button
                startIcon={<AddIcon />}
                color="info"
                size="small"
                onClick={() =>
                  database.teamChars.newBuildTcFromBuild(
                    teamCharId,
                    weaponTypeKey
                  )
                }
              >
                New TC Build
              </Button>
            </Box>
            {buildTcIds.map((id) => (
              <BuildTc
                key={id}
                buildTcId={id}
                active={buildType === 'tc' && buildTcId === id}
              />
            ))}
          </CardContent>
        </CardThemed>
      </ModalWrapper>
    </>
  )
}
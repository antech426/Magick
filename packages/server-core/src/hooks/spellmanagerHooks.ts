import { SpellManager } from '@magickml/engine'
import { otJson0 } from 'ot-json0'
import { Spell } from '../client'
import { HookContext } from '../declarations'
import { getSpell } from '../helpers/getSpell'

export const checkForSpellInManager = async (context: HookContext) => {
  const { app, params, data } = context
  const { user } = params
  const { id } = data

  const projectId = data.projectId || params.query.projectId

  if (!user) throw new Error('No user is present in service')
  // Here we get the users spellManagerApp
  console.log('Gettig spell manager for user', user.id.toString())
  const spellManager = app.userSpellManagers.get(user.id.toString())

  if (!spellManager) throw new Error('No spell manager created for user!')
  const decodedId =
    (id as string).length > 36 ? (id as string).slice(0, 36) : (id as string)

  if (!spellManager.hasSpellRunner(decodedId)) {
    const spell = await getSpell({ app, id: decodedId, projectId })
    await spellManager.load(spell as Spell)
  }
}

// When the spell updates on the server, we need to update the spell in the spell manager
export const updateSpellInManager = async (context: HookContext) => {
  const { app, params, data } = context
  const { user } = params
  const { spellUpdate, diff, id } = data

  // Here we get the users spellManagerApp
  const spellManager = app.userSpellManagers.get(user.id.toString())
  const decodedId =
    (id as string).length > 36 ? (id as string).slice(0, 36) : (id as string)

  const spellRunner = spellManager.getSpellRunner(decodedId)
  if (!spellRunner) throw new Error('No spell runner found!')

  if (diff) {
    const spell = spellRunner.currentSpell
    const updatedSpell = otJson0.type.apply(spell, diff)
    spellManager.load(updatedSpell, true)
    return updatedSpell
  }

  if (spellUpdate) {
    spellManager.load(spellUpdate, true)
    return spellUpdate
  }
}